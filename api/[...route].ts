
import express, { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('SchoolOS backend: SUPABASE_URL / SUPABASE_ANON_KEY are not configured.');
}

const ACCESS_COOKIE = 'schoolos_access';
const REFRESH_COOKIE = 'schoolos_refresh';
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
  return data ? normalizeProfile(data) : null;
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

  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = new Set<string>();
  if (process.env.APP_URL) allowed.add(process.env.APP_URL.replace(/\/+$/, ''));
  if (req.headers.host) {
    const protocol = process.env.VERCEL ? 'https' : (req.headers['x-forwarded-proto'] as string || 'http');
    allowed.add(`${protocol}://${req.headers.host}`);
  }

  if (!allowed.has(origin.replace(/\/+$/, ''))) {
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
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) return jsonError(res, 400, 'Email and password are required.');

  try {
    const client = serverClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return jsonError(res, 401, 'Invalid email or password.');
    }

    const authenticated = serverClient(data.session.access_token);
    const profile = await loadProfile(authenticated, data.user.id);

    if (!profile) {
      await client.auth.signOut();
      return jsonError(res, 403, 'Your account is authenticated, but no employee profile has been assigned.');
    }

    setSessionCookies(
      res,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at
    );

    return res.json({
      ok: true,
      data: {
        user: { email: data.user.email || email },
        profile,
      },
    });
  } catch (error: any) {
    return jsonError(res, 500, 'Unable to complete sign in.');
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
  if (!email) return jsonError(res, 400, 'Email is required.');

  try {
    const configuredAppUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
    const origin = configuredAppUrl || `${process.env.VERCEL ? 'https' : 'http'}://${req.headers.host}`;
    const redirectTo = `${origin}/?type=recovery`;

    await serverClient().auth.resetPasswordForEmail(email, { redirectTo });

    // Deliberately do not reveal whether the address exists.
    return res.json({
      ok: true,
      data: { message: 'If the account exists, a password reset link has been sent.' },
    });
  } catch {
    return res.json({
      ok: true,
      data: { message: 'If the account exists, a password reset link has been sent.' },
    });
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
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 6) return jsonError(res, 400, 'Password must be at least 6 characters long.');

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { error } = await auth.supabase.auth.updateUser({ password });
    if (error) return jsonError(res, 400, error.message);

    clearSessionCookies(res);
    return res.json({ ok: true, data: { message: 'Password updated successfully.' } });
  } catch {
    return jsonError(res, 500, 'Unable to update the password.');
  }
});

app.get('/api/bootstrap', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const schoolId = auth.profile.school_id;

    const [schoolResult, studentsResult, employeesResult] = await Promise.all([
      auth.supabase.from('schools').select('id, created_at, school_name').eq('id', schoolId).maybeSingle(),
      auth.supabase.from('students').select('*').eq('school_id', schoolId).order('id', { ascending: false }),
      auth.supabase.from('employee_profiles').select('id, user_id, school_id, role, full_name').eq('school_id', schoolId),
    ]);

    if (schoolResult.error) return jsonError(res, 500, 'Unable to load school information.');
    if (studentsResult.error) return jsonError(res, 500, 'Unable to load students.');
    if (employeesResult.error) return jsonError(res, 500, 'Unable to load employee profiles.');

    const school = schoolResult.data
      ? {
          id: Number(schoolResult.data.id),
          created_at: schoolResult.data.created_at,
          school_name: schoolResult.data.school_name || `School #${schoolId}`,
        }
      : { id: schoolId, school_name: `School #${schoolId}` };

    const students = (studentsResult.data || []).map((row: any) => ({
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

    const employees = (employeesResult.data || []).map(normalizeProfile);

    return res.json({
      ok: true,
      data: { school, students, employees },
    });
  } catch {
    return jsonError(res, 500, 'Unable to load school data.');
  }
});

function canManageStudents(role: string) {
  return role === 'principal' || role === 'admin' || role === 'super_admin';
}

function canDeleteStudents(role: string) {
  return role === 'principal' || role === 'super_admin';
}

function cleanStudentPayload(input: any) {
  const today = new Date().toISOString().split('T')[0];
  return {
    roll_no: typeof input?.roll_no === 'string' ? input.roll_no.trim() : '',
    full_name: typeof input?.full_name === 'string' ? input.full_name.trim() : '',
    date_of_birth: typeof input?.date_of_birth === 'string' && input.date_of_birth ? input.date_of_birth : null,
    gender: typeof input?.gender === 'string' ? input.gender.trim() : '',
    class_grade: typeof input?.class_grade === 'string' ? input.class_grade.trim() : '',
    section: typeof input?.section === 'string' ? input.section.trim() : '',
    guardian_name: typeof input?.guardian_name === 'string' ? input.guardian_name.trim() : '',
    guardian_phone: typeof input?.guardian_phone === 'string' ? input.guardian_phone.trim() : '',
    residential_address: typeof input?.residential_address === 'string' ? input.residential_address.trim() : '',
    admission_date: typeof input?.admission_date === 'string' && input.admission_date ? input.admission_date : today,
  };
}

app.get('/api/students', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { data, error } = await auth.supabase
      .from('students')
      .select('*')
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
    if (!payload.roll_no || !payload.full_name || !payload.class_grade || !payload.section) {
      return jsonError(res, 400, 'Required student fields are missing.');
    }

    const { data, error } = await auth.supabase
      .from('students')
      .insert([{ ...payload, school_id: auth.profile.school_id }])
      .select()
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
    if (!payload.roll_no || !payload.full_name || !payload.class_grade || !payload.section) {
      return jsonError(res, 400, 'Required student fields are missing.');
    }

    const { data, error } = await auth.supabase
      .from('students')
      .update(payload)
      .eq('id', id)
      .eq('school_id', auth.profile.school_id)
      .select()
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

app.get('/api/security/query-school', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const targetSchoolId = Number(req.query.schoolId);
    if (!Number.isInteger(targetSchoolId) || targetSchoolId <= 0) {
      return jsonError(res, 400, 'Invalid school identifier.');
    }

    const { data, error } = await auth.supabase
      .from('students')
      .select('id, school_id, roll_no, full_name')
      .eq('school_id', targetSchoolId);

    if (error) {
      return res.json({
        ok: true,
        data: {
          testedSchoolId: targetSchoolId,
          rowCount: 0,
          error: error.message,
          blocked: true,
          message: 'Query rejected by database access policy.',
        },
      });
    }

    const count = data?.length || 0;
    return res.json({
      ok: true,
      data: {
        testedSchoolId: targetSchoolId,
        rowCount: count,
        error: null,
        blocked: count === 0,
        message: count === 0
          ? `Access blocked: 0 records returned for School #${targetSchoolId}.`
          : `Warning: received ${count} records for School #${targetSchoolId}.`,
      },
    });
  } catch {
    return jsonError(res, 500, 'Security query failed.');
  }
});

app.post('/api/security/unauthorized-insert', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const targetSchoolId = Number(req.body?.schoolId);
    if (!Number.isInteger(targetSchoolId) || targetSchoolId <= 0) {
      return jsonError(res, 400, 'Invalid school identifier.');
    }

    const probe = {
      school_id: targetSchoolId,
      roll_no: `SEC-TEST-${Date.now()}`,
      full_name: 'Security Test Probe',
      date_of_birth: '2010-01-01',
      gender: 'Other',
      class_grade: 'Test',
      section: 'X',
      guardian_name: 'Security Auditor',
      guardian_phone: '000-000-0000',
      residential_address: 'RLS Test Sandbox',
      admission_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await auth.supabase.from('students').insert(probe).select();

    if (error) {
      return res.json({
        ok: true,
        data: { rejected: true, error: error.message, message: 'Mutation rejected by database access policy.' },
      });
    }

    if (data?.[0]?.id) {
      await auth.supabase.from('students').delete().eq('id', data[0].id).eq('school_id', targetSchoolId);
    }

    return res.json({
      ok: true,
      data: { rejected: false, error: null, message: 'Warning: unauthorized insert was permitted.' },
    });
  } catch {
    return jsonError(res, 500, 'Security insert test failed.');
  }
});

app.post('/api/security/unauthorized-delete', async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const studentId = Number(req.body?.studentId);
    const targetSchoolId = Number(req.body?.schoolId);
    if (!Number.isInteger(studentId) || !Number.isInteger(targetSchoolId)) {
      return jsonError(res, 400, 'Invalid security test identifiers.');
    }

    const { data, error } = await auth.supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('school_id', targetSchoolId)
      .select();

    if (error) {
      return res.json({ ok: true, data: { rejected: true, error: error.message, message: 'DELETE rejected by database access policy.' } });
    }

    if (!data || data.length === 0) {
      return res.json({ ok: true, data: { rejected: true, error: null, message: 'DELETE produced 0 row changes; access policy blocked it.' } });
    }

    return res.json({ ok: true, data: { rejected: false, error: null, message: 'Warning: DELETE was permitted on the target record.' } });
  } catch {
    return jsonError(res, 500, 'Security delete test failed.');
  }
});

export default app;
