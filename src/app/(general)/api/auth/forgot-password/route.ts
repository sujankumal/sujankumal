import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/../prisma/prisma';
import { verifyTurnstileToken } from '@/services/captcha';
import { sendEmail } from '@/services/email';
import { logSecurityEvent } from '@/services/security-logger';
import { getClientIp, authRateLimiter } from '@/lib/rate-limiter';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // Rate limiting check
  const rateLimit = authRateLimiter.check(`forgot-password:${clientIp}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many password reset requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid email address';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, captchaToken } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify Turnstile CAPTCHA
    const captchaResult = await verifyTurnstileToken(captchaToken, clientIp);
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || 'CAPTCHA validation failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user exists, create secure token and dispatch email
    if (user) {
      // Generate 32-byte cryptographic random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      // Delete any previous tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });

      // Save new token
      await prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: resetToken,
          expires,
        },
      });

      // Derive base URL for the link
      const origin =
        request.headers.get('origin') ||
        process.env.METADATA_BASE_URL ||
        process.env.NEXTAUTH_URL ||
        'https://sujankumal.com.np';

      const resetLink = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111827; color: #f3f4f6; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-top: 0;">Password Reset Request</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>We received a request to reset the password for your account associated with <strong>${normalizedEmail}</strong>.</p>
          <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="font-size: 11px; word-break: break-all; color: #ea580c;"><a href="${resetLink}" style="color: #ea580c;">${resetLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #374151; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
      `;

      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset Your Password - Sujan Kumal',
        html,
      });

      await logSecurityEvent({
        userId: user.id,
        event: 'PASSWORD_CHANGED',
        ipAddress: clientIp,
        userAgent,
        details: { event: 'Password reset requested' },
      });
    }

    // Always return the exact same message to protect against user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email address, you will receive password reset instructions shortly.',
    });
  } catch (error: any) {
    console.error('[auth:forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
