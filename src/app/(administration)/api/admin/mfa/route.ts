import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import prisma from '@/../prisma/prisma';
import bcrypt from 'bcrypt';
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotp,
  generateBackupCodes,
} from '@/services/totp';
import { logSecurityEvent } from '@/services/security-logger';

// GET: Check MFA status or initiate setup
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, twoFactorEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({
      enabled: true,
      email: user.email,
    });
  }

  // Generate a new TOTP secret for setup
  const secret = generateTotpSecret(20);
  const otpUri = generateTotpUri(secret, user.email || 'user', 'SujanKumal');

  return NextResponse.json({
    enabled: false,
    secret,
    otpUri,
  });
}

// POST: Verify and activate MFA
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { token, secret } = body;

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required.' },
        { status: 400 }
      );
    }

    const isValid = verifyTotp(token.trim(), secret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your authenticator app clock and try again.' },
        { status: 400 }
      );
    }

    // Generate backup recovery codes
    const plainBackupCodes = generateBackupCodes(8);

    // Hash backup codes before persisting
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map(async (code) => {
        const hash = await bcrypt.hash(code, 12);
        return {
          codeHash: hash,
          used: false,
        };
      })
    );

    // Save secret, enable 2FA, and replace existing backup codes
    await prisma.$transaction(async (tx) => {
      await tx.twoFactorBackupCode.deleteMany({
        where: { userId: user.id },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          backupCodes: {
            create: hashedBackupCodes,
          },
        },
      });
    });

    await logSecurityEvent({
      userId: user.id,
      event: 'MFA_ENABLED',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully.',
      backupCodes: plainBackupCodes,
    });
  } catch (error) {
    console.error('Failed to enable MFA:', error);
    return NextResponse.json(
      { error: 'Failed to enable MFA. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE: Disable MFA
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Current password is required to disable 2FA.' },
          { status: 400 }
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid password.' },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction([
      prisma.twoFactorBackupCode.deleteMany({
        where: { userId: user.id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
        },
      }),
    ]);

    await logSecurityEvent({
      userId: user.id,
      event: 'MFA_DISABLED',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully.',
    });
  } catch (error) {
    console.error('Failed to disable MFA:', error);
    return NextResponse.json(
      { error: 'Failed to disable MFA.' },
      { status: 500 }
    );
  }
}
