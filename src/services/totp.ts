import crypto from 'crypto';

const RFC4648_BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer into a Base32 string (RFC 4648 without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += RFC4648_BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += RFC4648_BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = RFC4648_BASE32_CHARS.indexOf(cleanInput[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${cleanInput[i]}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random cryptographic Base32 secret for TOTP (RFC 6238).
 */
export function generateTotpSecret(length = 20): string {
  const randomBytes = crypto.randomBytes(length);
  return base32Encode(randomBytes);
}

/**
 * Generates an OTP Auth URI for scanning with Google Authenticator, 1Password, Authy.
 */
export function generateTotpUri(secret: string, accountName: string, issuer = 'SujanKumal'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes the 6-digit TOTP code for a given secret at a specific counter step.
 */
function computeTotpCode(secretBase32: string, counter: number): string {
  const secretBuffer = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a Base32 secret with clock drift tolerance.
 *
 * @param token 6-digit string provided by user
 * @param secret Base32 encoded secret
 * @param window Tolerance window in steps of 30s (default: 1 step, allows +-30s drift)
 */
export function verifyTotp(token: string, secret: string, window = 1): boolean {
  if (!token || token.length !== 6 || !secret) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const stepCounter = currentCounter + i;
    const expectedCode = computeTotpCode(secret, stepCounter);
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates random one-time backup recovery codes.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 hex characters
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}
