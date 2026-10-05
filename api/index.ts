
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

// API responses must never be cached by browsers, proxies, or shared caches.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
  next();
});

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('SchoolOS backend: SUPABASE_URL / SUPABASE_ANON_KEY are not configured.');
}

const COOKIE_PREFIX = (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)) ? '__Host-' : '';
const ACCESS_COOKIE = `${COOKIE_PREFIX}schoolos_access`;
const REFRESH_COOKIE = `${COOKIE_PREFIX}schoolos_refresh`;
const SESSION_HINT_COOKIE = 'schoolos_session_hint';
const ACCESS_MAX_AGE = 60 * 60 * 1000;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

type Profile = {
  id: string;
  user_id: string;
  school_id: number;
  role: string;
  full_name: string;
};

type AuthedContext = {
  user: { id: string; email?: string };
  profile: Profile;
  supabase: SupabaseClient;
};

const profileCache = new Map<string, { profile: Profile | null; expiresAt: number }>();
const PROFILE_CACHE_TTL = 15_000;

// Lightweight abuse protection for serverless instances. Supabase/Auth rate limits
// remain the authoritative second layer; this layer slows repeated attacks before
// they reach Auth or the database.
type RateEntry = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 8;
const RECOVERY_LIMIT = 6;

function rateLimitKey(req: Request, scope: string, identity = '') {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip || 'unknown';
  return `${scope}:${ip}:${identity.toLowerCase().trim()}`;
}

function consumeRateLimit(req: Request, scope: string, limit: number, identity = '') {
  const key = rateLimitKey(req, scope, identity);
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function isValidEmail(email: unknown) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPasswordInput(password: unknown) {
  return typeof password === 'string' && password.length >= 1 && password.length <= 256;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function cacheKey(userId: string) {
  return crypto.createHash('sha256').update(userId).digest('hex');
}

function serverClient(accessToken?: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  return header.split(';').reduce<Record<string, string>>((out, part) => {
    const index = part.indexOf('=');
    if (index < 0) return out;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
    return out;
  }, {});
}

function setSessionCookies(res: Response, accessToken: string, refreshToken: string, expiresAt?: number) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const accessMaxAge = expiresAt
    ? Math.max(60_000, expiresAt * 1000 - Date.now())
    : ACCESS_MAX_AGE;

  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessMaxAge,
  });
  res.cookie(SESSION_HINT_COOKIE, '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

function clearSessionCookies(res: Response) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const options = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
  res.clearCookie(SESSION_HINT_COOKIE, { ...options, httpOnly: false });
}

function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ ok: false, error: message });
}

function normalizeProfile(row: any): Profile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    school_id: Number(row.school_id),
    role: String(row.role || 'teacher').toLowerCase(),
    full_name: String(row.full_name || 'Staff Member'),
  };
}

async function loadProfile(supabase: SupabaseClient, userId: string) {
  const key = cacheKey(userId);
  const cached = profileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  let { data, error } = await supabase
    .from('employee_profiles')
    .select('id, user_id, school_id, role, full_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data && !error) {
    const fallback = await supabase
      .from('employee_profiles')
      .select('id, user_id, school_id, role, full_name')
      .eq('id', userId)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  const profile = data ? normalizeProfile(data) : null;
  profileCache.set(key, { profile, expiresAt: Date.now() + PROFILE_CACHE_TTL });
  return profile;
}

async function authenticate(req: Request, res: Response): Promise<AuthedContext | null> {
  const cookies = parseCookies(req);
  let accessToken = cookies[ACCESS_COOKIE] || '';
  const refreshToken = cookies[REFRESH_COOKIE] || '';

  if (!accessToken && !refreshToken) {
    jsonError(res, 401, 'Authentication required.');
    return null;
  }

  let authClient = accessToken ? serverClient(accessToken) : serverClient();
  let { data: userData, error: userError } = accessToken
    ? await authClient.auth.getUser(accessToken)
    : { data: { user: null }, error: null as any };

  if ((!userData.user || userError) && refreshToken) {
    const refreshClient = serverClient();
    const refreshed = await refreshClient.auth.refreshSession({ refresh_token: refreshToken });

    if (refreshed.error || !refreshed.data.session || !refreshed.data.user) {
      clearSessionCookies(res);
      jsonError(res, 401, 'Session expired. Please sign in again.');
      return null;
    }

    accessToken = refreshed.data.session.access_token;
    setSessionCookies(
      res,
      refreshed.data.session.access_token,
      refreshed.data.session.refresh_token,
      refreshed.data.session.expires_at
    );
    authClient = serverClient(accessToken);
    userData = { user: refreshed.data.user };
    userError = null;
  }

  if (!userData.user || userError) {
    clearSessionCookies(res);
    jsonError(res, 401, 'Session expired. Please sign in again.');
    return null;
  }

  const profile = await loadProfile(authClient, userData.user.id);
  if (!profile) {
    clearSessionCookies(res);
    jsonError(res, 403, 'Your account has no employee profile assigned.');
    return null;
  }

  return {
    user: { id: userData.user.id, email: userData.user.email || undefined },
    profile,
    supabase: authClient,
  };
}

function requireOrigin(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/+$/, '') : '';
  const configured = (process.env.APP_URL || '').replace(/\/+$/, '');
  const vercelOrigin = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : '';
  const localAllowed = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);

  // Browser state-changing requests must carry an Origin. This blocks cross-site
  // POST/PUT/DELETE attempts even though the auth cookies are HttpOnly.
  if (!origin) return jsonError(res, 403, 'Request origin is required.');

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const allowedOrigins = new Set([configured, vercelOrigin].filter(Boolean));
    if (!allowedOrigins.has(origin)) return jsonError(res, 403, 'Request origin is not allowed.');
  } else if (origin !== configured && !localAllowed.has(origin)) {
    return jsonError(res, 403, 'Request origin is not allowed.');
  }

  return next();
}

app.use(requireOrigin);

app.get('/api/health', async (_req, res) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return jsonError(res, 500, 'Backend configuration is incomplete.');
  return res.json({ ok: true, data: { service: 'SchoolOS API', status: 'healthy' } });
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;

  const limiter = consumeRateLimit(req, 'login', LOGIN_LIMIT, email);
  if (!limiter.allowed) {
    res.setHeader('Retry-After', String(limiter.retryAfter));
    return jsonError(res, 429, 'Too many sign-in attempts. Please try again later.');
  }

  if (!isValidEmail(email) || !isValidPasswordInput(password)) {
    return jsonError(res, 400, 'Email and password are required.');
  }

  try {
    const client = serverClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    // Never log or persist the supplied password. Supabase Auth verifies it against
    // its salted password hash; the application does not store the plaintext value.
    if (error || !data.session || !data.user) {
      return jsonError(res, 401, 'Invalid email or password.');
    }

    const profile = await loadProfile(client, data.user.id);
    if (!profile) {
      await client.auth.signOut();
      return jsonError(res, 403, 'This account is not authorized for SchoolOS.');
    }

    setSessionCookies(res, data.session.access_token, data.session.refresh_token, data.session.expires_at);
    return res.json({ ok: true, data: { user: { email: data.user.email || email }, profile } });
  } catch {
    return jsonError(res, 500, 'Unable to complete sign-in.');
  }
});

app.get('/api/auth/session', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    return res.json({
      ok: true,
      data: {
        user: { email: auth.user.email || '' },
        profile: auth.profile,
      },
    });
  } catch {
    return jsonError(res, 500, 'Unable to verify the current session.');
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const cookies = parseCookies(req);
    if (cookies[ACCESS_COOKIE]) {
      await serverClient(cookies[ACCESS_COOKIE]).auth.signOut().catch(() => undefined);
    }
  } finally {
    clearSessionCookies(res);
  }
  return res.json({ ok: true, data: null });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const limiter = consumeRateLimit(req, 'password-reset', RECOVERY_LIMIT, email);
  if (!limiter.allowed) {
    res.setHeader('Retry-After', String(limiter.retryAfter));
    return jsonError(res, 429, 'Too many password reset requests. Please try again later.');
  }

  if (!isValidEmail(email)) return jsonError(res, 400, 'Enter a valid email address.');

  try {
    const client = serverClient();
    const redirectTo = process.env.APP_URL
      ? `${process.env.APP_URL.replace(/\/+$/, '')}/reset-password`
      : '';
    if (!redirectTo) return jsonError(res, 500, 'Password recovery is not configured.');

    // Keep this response identical for known and unknown accounts to avoid user enumeration.
    await client.auth.resetPasswordForEmail(email, { redirectTo });
    return res.json({ ok: true, data: { message: 'If the account exists, a password reset email has been sent.' } });
  } catch {
    return res.json({ ok: true, data: { message: 'If the account exists, a password reset email has been sent.' } });
  }
});

app.post('/api/auth/recovery', async (req, res) => {
  const accessToken = typeof req.body?.access_token === 'string' ? req.body.access_token : '';
  const refreshToken = typeof req.body?.refresh_token === 'string' ? req.body.refresh_token : '';

  if (!accessToken || !refreshToken) return jsonError(res, 400, 'Recovery session is incomplete.');

  try {
    const client = serverClient(accessToken);
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return jsonError(res, 401, 'Recovery link is invalid or expired.');

    const profile = await loadProfile(client, data.user.id);
    if (!profile) return jsonError(res, 403, 'This account has no employee profile assigned.');

    setSessionCookies(res, accessToken, refreshToken);
    return res.json({ ok: true, data: { profile } });
  } catch {
    return jsonError(res, 401, 'Recovery link is invalid or expired.');
  }
});

app.post('/api/auth/password', async (req, res) => {
  const password = req.body?.password;
  const limiter = consumeRateLimit(req, 'password-change', 6);
  if (!limiter.allowed) {
    res.setHeader('Retry-After', String(limiter.retryAfter));
    return jsonError(res, 429, 'Too many password change attempts. Please try again later.');
  }

  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    return jsonError(res, 400, 'Password must be between 12 and 256 characters.');
  }

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { error } = await auth.supabase.auth.updateUser({ password });
    if (error) return jsonError(res, 400, 'Unable to update the password.');

    clearSessionCookies(res);
    return res.json({ ok: true, data: { message: 'Password updated successfully. Please sign in again.' } });
  } catch {
    return jsonError(res, 500, 'Unable to update the password.');
  }
});

app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const schoolId = auth.profile.school_id;
    const [schoolResult, studentCountResult, employeeCountResult, recentStudentsResult] = await Promise.all([
      auth.supabase.from('schools').select('id, created_at, school_name').eq('id', schoolId).maybeSingle(),
      auth.supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      auth.supabase.from('employee_profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      auth.supabase
        .from('students')
        .select('id, created_at, school_id, roll_no, full_name, date_of_birth, gender, class_grade, section, guardian_name, guardian_phone, residential_address, admission_date')
        .eq('school_id', schoolId)
        .order('id', { ascending: false })
        .limit(5),
    ]);

    if (schoolResult.error || studentCountResult.error || employeeCountResult.error || recentStudentsResult.error) {
      return jsonError(res, 500, 'Unable to load dashboard summary.');
    }

    const school = schoolResult.data
      ? {
          id: Number(schoolResult.data.id),
          created_at: schoolResult.data.created_at,
          school_name: schoolResult.data.school_name || `School #${schoolId}`,
        }
      : { id: schoolId, school_name: `School #${schoolId}` };

    const recentStudents = (recentStudentsResult.data || []).map((row: any) => ({
      id: Number(row.id),
      created_at: row.created_at,
      school_id: Number(row.school_id),
      roll_no: row.roll_no != null ? String(row.roll_no) : '',
      full_name: row.full_name ?? '',
      date_of_birth: row.date_of_birth ?? '',
      gender: row.gender ?? '',
      class_grade: row.class_grade ?? '',
      section: row.section ?? '',
      guardian_name: row.guardian_name ?? '',
      guardian_phone: row.guardian_phone ?? '',
      residential_address: row.residential_address ?? '',
      admission_date: row.admission_date ?? '',
    }));

    return res.json({
      ok: true,
      data: {
        school,
        studentCount: studentCountResult.count || 0,
        employeeCount: employeeCountResult.count || 0,
        recentStudents,
      },
    });
  } catch {
    return jsonError(res, 500, 'Unable to load dashboard summary.');
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!['principal', 'admin', 'super_admin'].includes(auth.profile.role)) {
      return jsonError(res, 403, 'You do not have permission to view employee profiles.');
    }

    const { data, error } = await auth.supabase
      .from('employee_profiles')
      .select('id, user_id, school_id, role, full_name')
      .eq('school_id', auth.profile.school_id)
      .order('full_name', { ascending: true });

    if (error) return jsonError(res, 500, 'Unable to load employee profiles.');
    return res.json({ ok: true, data: (data || []).map(normalizeProfile) });
  } catch {
    return jsonError(res, 500, 'Unable to load employee profiles.');
  }
});


function isSuperAdmin(role: string) {
  return role === 'super_admin';
}

function canProvisionUsers(role: string) {
  return ['super_admin', 'principal', 'admin'].includes(role);
}

function allowedProvisionedRole(actorRole: string, requestedRole: unknown) {
  const role = typeof requestedRole === 'string' ? requestedRole.toLowerCase().trim() : '';
  if (actorRole === 'super_admin') {
    return ['principal', 'admin', 'teacher'].includes(role) ? role : null;
  }
  if (actorRole === 'principal' || actorRole === 'admin') {
    return role === 'teacher' ? role : null;
  }
  return null;
}

function serviceClient() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isSafeName(value: unknown, max = 120) {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= max;
}


app.post('/api/platform/bootstrap', async (req, res) => {
  try {
    const token = typeof req.headers['x-schoolos-bootstrap-token'] === 'string'
      ? req.headers['x-schoolos-bootstrap-token']
      : '';
    const expected = (process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN || '').trim();
    if (!expected || token.length < 20 || token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return jsonError(res, 403, 'Bootstrap authorization failed.');
    }

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const { count, error: countError } = await service
      .from('employee_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if (countError) return jsonError(res, 500, 'Unable to verify platform administrator state.');
    if ((count || 0) > 0) return jsonError(res, 409, 'A Super Admin already exists.');

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const schoolId = Number(req.body?.school_id);
    if (!isValidEmail(email) || !Number.isInteger(schoolId) || schoolId <= 0) {
      return jsonError(res, 400, 'A valid email and school are required.');
    }

    const school = await service.from('schools').select('id').eq('id', schoolId).maybeSingle();
    if (school.error || !school.data) return jsonError(res, 400, 'The selected school does not exist.');

    let foundUser: any = null;
    for (let page = 1; page <= 20 && !foundUser; page += 1) {
      const listed = await service.auth.admin.listUsers({ page, perPage: 100 });
      if (listed.error) return jsonError(res, 500, 'Unable to locate the account.');
      foundUser = listed.data.users.find((u) => (u.email || '').toLowerCase() === email) || null;
      if (listed.data.users.length < 100) break;
    }

    if (!foundUser) return jsonError(res, 404, 'Create the platform administrator account in Supabase Auth first, then run bootstrap again.');

    const { data: existingProfile, error: profileError } = await service
      .from('employee_profiles')
      .select('id, user_id, school_id, role, full_name')
      .eq('user_id', foundUser.id)
      .maybeSingle();

    if (profileError) return jsonError(res, 500, 'Unable to locate the employee profile.');

    if (existingProfile) {
      const updated = await service
        .from('employee_profiles')
        .update({ role: 'super_admin', school_id: schoolId })
        .eq('id', existingProfile.id)
        .select('id, user_id, school_id, role, full_name')
        .single();
      if (updated.error || !updated.data) return jsonError(res, 500, 'Unable to promote the account.');
      profileCache.delete(cacheKey(foundUser.id));
      return res.json({ ok: true, data: { ...normalizeProfile(updated.data), email } });
    }

    const created = await service
      .from('employee_profiles')
      .insert([{
        user_id: foundUser.id,
        school_id: schoolId,
        role: 'super_admin',
        full_name: foundUser.user_metadata?.full_name || email.split('@')[0],
      }])
      .select('id, user_id, school_id, role, full_name')
      .single();

    if (created.error || !created.data) return jsonError(res, 500, 'Unable to create the platform administrator profile.');
    profileCache.delete(cacheKey(foundUser.id));
    return res.status(201).json({ ok: true, data: { ...normalizeProfile(created.data), email } });
  } catch {
    return jsonError(res, 500, 'Unable to bootstrap the platform administrator.');
  }
});

app.get('/api/admin/schools', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!isSuperAdmin(auth.profile.role)) return jsonError(res, 403, 'Only the Super Admin can manage schools.');

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const { data, error } = await service
      .from('schools')
      .select('id, created_at, school_name')
      .order('school_name', { ascending: true });

    if (error) return jsonError(res, 500, 'Unable to load schools.');
    return res.json({ ok: true, data: data || [] });
  } catch {
    return jsonError(res, 500, 'Unable to load schools.');
  }
});

app.post('/api/admin/schools', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!isSuperAdmin(auth.profile.role)) return jsonError(res, 403, 'Only the Super Admin can create schools.');

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const schoolName = typeof req.body?.school_name === 'string' ? req.body.school_name.trim() : '';
    if (!isSafeName(schoolName, 150)) return jsonError(res, 400, 'Enter a valid school name.');

    const { data, error } = await service
      .from('schools')
      .insert([{ school_name: schoolName.slice(0, 150) }])
      .select('id, created_at, school_name')
      .single();

    if (error) return jsonError(res, 400, 'Unable to create the school.');
    return res.status(201).json({ ok: true, data });
  } catch {
    return jsonError(res, 500, 'Unable to create the school.');
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!canProvisionUsers(auth.profile.role)) return jsonError(res, 403, 'You do not have permission to manage users.');

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const requestedSchoolId = Number(req.query.schoolId);
    const schoolId = auth.profile.role === 'super_admin'
      ? (Number.isInteger(requestedSchoolId) && requestedSchoolId > 0 ? requestedSchoolId : null)
      : auth.profile.school_id;

    let profileQuery = service
      .from('employee_profiles')
      .select('id, user_id, school_id, role, full_name')
      .order('full_name', { ascending: true });

    if (schoolId !== null) profileQuery = profileQuery.eq('school_id', schoolId);

    const { data: profiles, error } = await profileQuery;
    if (error) return jsonError(res, 500, 'Unable to load user profiles.');

    const profileRows = profiles || [];
    const emailByUserId = new Map<string, string>();
    // Auth admin listing is server-only; never expose auth tokens or password data.
    for (let page = 1; page <= 20; page += 1) {
      const listed = await service.auth.admin.listUsers({ page, perPage: 100 });
      if (listed.error) break;
      for (const user of listed.data.users) {
        if (user.id) emailByUserId.set(user.id, user.email || '');
      }
      if (listed.data.users.length < 100) break;
    }

    const data = profileRows.map((row: any) => ({
      ...normalizeProfile(row),
      email: emailByUserId.get(String(row.user_id)) || '',
    }));

    return res.json({ ok: true, data });
  } catch {
    return jsonError(res, 500, 'Unable to load users.');
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    if (!canProvisionUsers(auth.profile.role)) {
      return jsonError(res, 403, 'You do not have permission to create users.');
    }

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
    const requestedRole = typeof req.body?.role === 'string' ? req.body.role.toLowerCase().trim() : '';
    const role = allowedProvisionedRole(auth.profile.role, requestedRole);

    if (!isValidEmail(email)) return jsonError(res, 400, 'Enter a valid email address.');
    if (!isSafeName(fullName)) return jsonError(res, 400, 'Enter a valid full name.');
    if (!role) {
      return jsonError(
        res,
        403,
        auth.profile.role === 'super_admin'
          ? 'Super Admins can create Principal, Admin, or Teacher accounts.'
          : 'School administrators can create Teacher accounts only.'
      );
    }

    const requestedSchoolId = Number(req.body?.school_id);
    const schoolId = auth.profile.role === 'super_admin'
      ? requestedSchoolId
      : auth.profile.school_id;

    if (!Number.isInteger(schoolId) || schoolId <= 0) return jsonError(res, 400, 'A valid school is required.');

    const { data: school, error: schoolError } = await service
      .from('schools')
      .select('id, school_name')
      .eq('id', schoolId)
      .maybeSingle();

    if (schoolError || !school) return jsonError(res, 400, 'The selected school does not exist.');

    const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${(process.env.APP_URL || '').replace(/\/+$/, '')}/`,
    });

    if (inviteError || !invited.user) {
      return jsonError(res, 400, 'Unable to invite this user. The email may already have an account.');
    }

    const { data: profileRow, error: profileError } = await service
      .from('employee_profiles')
      .insert([{
        user_id: invited.user.id,
        school_id: schoolId,
        role,
        full_name: fullName.slice(0, 120),
      }])
      .select('id, user_id, school_id, role, full_name')
      .single();

    if (profileError || !profileRow) {
      await service.auth.admin.deleteUser(invited.user.id).catch(() => undefined);
      return jsonError(res, 500, 'The account invitation could not be completed.');
    }

    profileCache.delete(cacheKey(invited.user.id));

    return res.status(201).json({
      ok: true,
      data: {
        ...normalizeProfile(profileRow),
        email,
        school_name: school.school_name,
        invitation_sent: true,
      },
    });
  } catch {
    return jsonError(res, 500, 'Unable to create the user account.');
  }
});

app.patch('/api/admin/users/:userId/role', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const service = serviceClient();
    if (!service) return jsonError(res, 503, 'User management is not configured on the server.');

    const targetUserId = String(req.params.userId || '');
    const requestedRole = typeof req.body?.role === 'string' ? req.body.role.toLowerCase().trim() : '';
    if (!targetUserId || !['principal', 'admin', 'teacher'].includes(requestedRole)) {
      return jsonError(res, 400, 'Invalid user or role.');
    }

    const { data: target, error: targetError } = await service
      .from('employee_profiles')
      .select('id, user_id, school_id, role, full_name')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetError || !target) return jsonError(res, 404, 'User profile not found.');

    if (auth.profile.role === 'super_admin') {
      // Super Admin may change school staff roles, but never create another Super Admin.
    } else if (['principal', 'admin'].includes(auth.profile.role)) {
      if (target.school_id !== auth.profile.school_id || requestedRole !== 'teacher') {
        return jsonError(res, 403, 'You can only manage Teacher roles within your own school.');
      }
    } else {
      return jsonError(res, 403, 'You do not have permission to change user roles.');
    }

    const { data, error } = await service
      .from('employee_profiles')
      .update({ role: requestedRole })
      .eq('user_id', targetUserId)
      .select('id, user_id, school_id, role, full_name')
      .single();

    if (error || !data) return jsonError(res, 400, 'Unable to update the user role.');
    profileCache.delete(cacheKey(targetUserId));
    return res.json({ ok: true, data: normalizeProfile(data) });
  } catch {
    return jsonError(res, 500, 'Unable to update the user role.');
  }
});

function canManageStudents(role: string) {
  return role === 'principal' || role === 'admin' || role === 'super_admin';
}

function canDeleteStudents(role: string) {
  return role === 'principal' || role === 'super_admin';
}

const STUDENT_SELECT = 'id, created_at, school_id, roll_no, full_name, date_of_birth, gender, class_grade, section, guardian_name, guardian_phone, residential_address, admission_date';

function cleanStudentPayload(input: any) {
  const today = new Date().toISOString().split('T')[0];
  const value = (key: string, max: number) => typeof input?.[key] === 'string' ? input[key].trim().slice(0, max) : '';
  const dateOfBirth = typeof input?.date_of_birth === 'string' && input.date_of_birth ? input.date_of_birth.trim() : '';
  const admissionDate = typeof input?.admission_date === 'string' && input.admission_date ? input.admission_date.trim() : today;

  return {
    roll_no: value('roll_no', 50),
    full_name: value('full_name', 120),
    date_of_birth: dateOfBirth && isValidDate(dateOfBirth) ? dateOfBirth : null,
    gender: value('gender', 30),
    class_grade: value('class_grade', 50),
    section: value('section', 20),
    guardian_name: value('guardian_name', 120),
    guardian_phone: value('guardian_phone', 40),
    residential_address: value('residential_address', 500),
    admission_date: isValidDate(admissionDate) ? admissionDate : today,
  };
}

function validateStudentPayload(payload: ReturnType<typeof cleanStudentPayload>) {
  if (!payload.roll_no || !payload.full_name || !payload.class_grade || !payload.section) {
    return 'Required student fields are missing.';
  }
  if (payload.date_of_birth && !isValidDate(payload.date_of_birth)) return 'Invalid date of birth.';
  if (!isValidDate(payload.admission_date)) return 'Invalid admission date.';
  return null;
}

app.get('/api/students', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { data, error } = await auth.supabase
      .from('students')
      .select(STUDENT_SELECT)
      .eq('school_id', auth.profile.school_id)
      .order('id', { ascending: false });

    if (error) return jsonError(res, 500, 'Unable to load students.');

    return res.json({ ok: true, data: data || [] });
  } catch {
    return jsonError(res, 500, 'Unable to load students.');
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!canManageStudents(auth.profile.role)) return jsonError(res, 403, 'You do not have permission to add students.');

    const payload = cleanStudentPayload(req.body);
    const validationError = validateStudentPayload(payload);
    if (validationError) return jsonError(res, 400, validationError);

    const { data, error } = await auth.supabase
      .from('students')
      .insert([{ ...payload, school_id: auth.profile.school_id }])
      .select(STUDENT_SELECT)
      .single();

    if (error) return jsonError(res, 400, 'Unable to create the student record.');

    return res.status(201).json({ ok: true, data });
  } catch {
    return jsonError(res, 500, 'Unable to create the student record.');
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!canManageStudents(auth.profile.role)) return jsonError(res, 403, 'You do not have permission to edit students.');

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return jsonError(res, 400, 'Invalid student identifier.');

    const payload = cleanStudentPayload(req.body);
    const validationError = validateStudentPayload(payload);
    if (validationError) return jsonError(res, 400, validationError);

    const { data, error } = await auth.supabase
      .from('students')
      .update(payload)
      .eq('id', id)
      .eq('school_id', auth.profile.school_id)
      .select(STUDENT_SELECT)
      .maybeSingle();

    if (error) return jsonError(res, 400, 'Unable to update the student record.');
    if (!data) return jsonError(res, 404, 'Student record not found.');

    return res.json({ ok: true, data });
  } catch {
    return jsonError(res, 500, 'Unable to update the student record.');
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    if (!canDeleteStudents(auth.profile.role)) return jsonError(res, 403, 'You do not have permission to delete students.');

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return jsonError(res, 400, 'Invalid student identifier.');

    const { data, error } = await auth.supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('school_id', auth.profile.school_id)
      .select('id')
      .maybeSingle();

    if (error) return jsonError(res, 400, 'Unable to delete the student record.');
    if (!data) return jsonError(res, 404, 'Student record not found.');

    return res.json({ ok: true, data: { success: true } });
  } catch {
    return jsonError(res, 500, 'Unable to delete the student record.');
  }
});


export default app;
