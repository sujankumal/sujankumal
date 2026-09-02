import crypto from 'crypto';

/**
 * Checks whether a given password has been exposed in data breaches using the
 * HaveIBeenPwned (HIBP) Pwned Passwords Range API with k-Anonymity.
 *
 * How it works:
 * 1. Computes SHA-1 hash of the password.
 * 2. Only sends the first 5 characters of the hash to HIBP.
 * 3. HIBP returns a list of matching hash suffixes without ever knowing the full hash or password.
 * 4. Checks locally if our hash suffix exists in the response.
 *
 * @param password The plaintext password to test
 * @returns {Promise<{ isPwned: boolean, breachesCount: number }>}
 */
export async function checkPwnedPassword(password: string): Promise<{ isPwned: boolean; breachesCount: number }> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SujanKumal-Security-Audit',
        'Add-Padding': 'true', // Prevents response length analysis attacks
      },
      // Timeout after 3 seconds so slow external networks don't block user experience
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      // If HIBP service is unavailable, fail open (do not block user) but log warning
      console.warn(`HIBP API returned status ${response.status}`);
      return { isPwned: false, breachesCount: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10) || 0;
        return { isPwned: count > 0, breachesCount: count };
      }
    }

    return { isPwned: false, breachesCount: 0 };
  } catch (error) {
    // If offline or network error, do not fail user registration
    console.warn('Unable to query HaveIBeenPwned range API:', error);
    return { isPwned: false, breachesCount: 0 };
  }
}
