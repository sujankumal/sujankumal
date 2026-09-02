import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '@/../prisma/prisma';
import { verifyTurnstileToken } from '@/services/captcha';
import { checkPwnedPassword } from '@/services/pwned';
import { logSecurityEvent } from '@/services/security-logger';
import { getClientIp, authRateLimiter } from '@/lib/rate-limiter';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // Rate limiting check
  const rateLimit = authRateLimiter.check(`register:${clientIp}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, captchaToken } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify Turnstile CAPTCHA token
    const captchaResult = await verifyTurnstileToken(captchaToken, clientIp);
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Check for breached passwords using HaveIBeenPwned k-anonymity API
    const pwnedResult = await checkPwnedPassword(password);
    if (pwnedResult.isPwned) {
      return NextResponse.json(
        {
          error: `This password was found in ${pwnedResult.breachesCount} known data breaches. For your security, please choose a stronger, unique password.`,
        },
        { status: 400 }
      );
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      // If user signed in with Google previously and has no password set yet
      if (!existingUser.password) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            name: existingUser.name || name,
          },
        });

        // Ensure profile exists
        if (!existingUser.profile) {
          await prisma.profile.create({
            data: {
              authorId: existingUser.id,
              email: normalizedEmail,
              about: `Profile for ${name}`,
            },
          });
        }

        await logSecurityEvent({
          userId: existingUser.id,
          event: 'PASSWORD_CHANGED',
          ipAddress: clientIp,
          userAgent,
          details: { reason: 'Password added to Google OAuth account' },
        });

        return NextResponse.json({
          success: true,
          message: 'Password successfully attached to your existing account. You can now log in using either method.',
        });
      }

      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // 4. Create new User and associated Profile
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        verified: false,
        profile: {
          create: {
            about: `Profile for ${name}`,
            email: normalizedEmail,
          },
        },
      },
    });

    await logSecurityEvent({
      userId: newUser.id,
      event: 'LOGIN_SUCCESS',
      ipAddress: clientIp,
      userAgent,
      details: { event: 'Account registered' },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
    });
  } catch (error: any) {
    console.error('[auth:register] Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating your account. Please try again.' },
      { status: 500 }
    );
  }
}
