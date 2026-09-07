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
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured in environment variables.');
    return { success: false, error: 'CAPTCHA validation is unavailable.' };
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
    return { success: false, error: 'CAPTCHA validation failed.' };
  }
}
