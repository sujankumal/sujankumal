/**
 * Server-side verification for Cloudflare Turnstile CAPTCHA tokens.
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  // If turnstile secret is not set, allow in development or fallback to standard Cloudflare test key
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    (process.env.NODE_ENV === 'development'
      ? '1x0000000000000000000000000000000AA' // Cloudflare official test key that always passes
      : '');

  if (!secretKey) {
    // If not configured in production, log warning and allow or block depending on policy
    console.warn('CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured in environment variables.');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA token is missing.' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(5000),
    });

    const data = (await res.json()) as TurnstileVerifyResponse;

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: data['error-codes']?.join(', ') || 'CAPTCHA validation failed.',
    };
  } catch (error) {
    console.error('Turnstile verification request error:', error);
    // In event of Cloudflare outage, allow request through to avoid locking out legitimate users
    return { success: true };
  }
}
