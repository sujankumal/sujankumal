/** CSRF token helper — used by client-side mutation helpers. */
export async function _csrfToken(): Promise<string> {
  try {
    return await fetch('/api/auth/csrf', { method: "GET", next: { revalidate: 10 } })
      .then(res => res.json())
      .then(data => data.csrfToken ?? '');
  } catch {
    return '';
  }
}
