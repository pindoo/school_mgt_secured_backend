
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok === false) {
      return {
        data: null,
        error: body?.error || 'Request failed.',
        status: response.status,
      };
    }

    return { data: (body?.data ?? null) as T, error: null, status: response.status };
  } catch {
    return { data: null, error: 'Unable to reach the SchoolOS server.', status: 0 };
  }
}
