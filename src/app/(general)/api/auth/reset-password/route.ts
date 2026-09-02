import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '@/../prisma/prisma';
import { verifyTurnstileToken } from '@/services/captcha';
import { checkPwnedPassword } from '@/services/pwned';
import { logSecurityEvent } from '@/services/security-logger';
import { getClientIp, authRateLimiter } from '@/lib/rate-limiter';

const resetPasswordSchema = z.object({
  email: z.email('Invalid email address'),
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // Rate limiting check
  const rateLimit = authRateLimiter.check(`reset-password:${clientIp}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many reset attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, token, password, captchaToken } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify Turnstile CAPTCHA
    const captchaResult = await verifyTurnstileToken(captchaToken, clientIp);
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || 'CAPTCHA validation failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Look up verification token
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token,
          },
        },
      });
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 3. Check for breached passwords
    const pwnedResult = await checkPwnedPassword(password);
    if (pwnedResult.isPwned) {
      return NextResponse.json(
        {
          error: `This password was found in ${pwnedResult.breachesCount} known data breaches. Please choose a more secure password.`,
        },
        { status: 400 }
      );
    }

    // 4. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Update password, unlock account if locked, and delete used verification token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastFailedLogin: null,
        },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token,
          },
        },
      }),
    ]);

    await logSecurityEvent({
      userId: user.id,
      event: 'PASSWORD_CHANGED',
      ipAddress: clientIp,
      userAgent,
      details: { event: 'Password successfully reset via token' },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been updated successfully! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[auth:reset-password] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
