import NextAuth from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { z } from 'zod';
import bcrypt from 'bcrypt';

import prisma from '../../prisma/prisma';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from '../../auth.config';
import { logSecurityEvent } from './security-logger';
import { verifyTotp } from './totp';
import { verifyTurnstileToken } from './captcha';

// Pre-computed constant bcrypt hash to prevent timing attack enumeration for nonexistent accounts
const DUMMY_BCRYPT_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@sujankumal.com.np" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
        captchaToken: { label: "CAPTCHA Token", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
            totpCode: z.string().optional(),
            captchaToken: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password, totpCode, captchaToken } = parsedCredentials.data;

        const captchaResult = await verifyTurnstileToken(captchaToken);
        if (!captchaResult.success) {
          throw new Error('CAPTCHA verification failed.');
        }

        // Fetch user with security and MFA attributes
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            backupCodes: {
              where: { used: false },
            },
          },
        });

        // 1. Account does not exist -> Run dummy comparison to equalize execution timing
        if (!user || !user.password) {
          await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
          await logSecurityEvent({
            event: 'LOGIN_FAILED',
            details: { email, reason: 'User not found or no password' },
          });
          return null;
        }

        // 2. Check if account is currently locked out
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.max(
            1,
            Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000))
          );
          await logSecurityEvent({
            userId: user.id,
            event: 'ACCOUNT_LOCKED',
            details: { email, remainingMinutes },
          });
          throw new Error(`Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`);
        }

        // 3. Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          const nextAttempts = (user.failedLoginAttempts || 0) + 1;
          let newLockedUntil: Date | null = null;

          if (nextAttempts >= 10) {
            // 10 failed attempts: 1 hour lockout
            newLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
          } else if (nextAttempts >= 5) {
            // 5 failed attempts: 15 minutes lockout
            newLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: nextAttempts,
              lastFailedLogin: new Date(),
              lockedUntil: newLockedUntil,
            },
          });

          await logSecurityEvent({
            userId: user.id,
            event: 'LOGIN_FAILED',
            details: {
              failedAttempts: nextAttempts,
              lockedUntil: newLockedUntil ? newLockedUntil.toISOString() : null,
            },
          });

          return null;
        }

        // 4. Multi-Factor Authentication (MFA / 2FA) Verification if enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!totpCode) {
            throw new Error('MFA_REQUIRED');
          }

          const isTotpValid = verifyTotp(totpCode.trim(), user.twoFactorSecret);
          let isBackupCodeValid = false;

          if (!isTotpValid) {
            // Check backup recovery codes
            for (const backup of user.backupCodes) {
              const matches = await bcrypt.compare(totpCode.trim(), backup.codeHash);
              if (matches) {
                isBackupCodeValid = true;
                await prisma.twoFactorBackupCode.update({
                  where: { id: backup.id },
                  data: { used: true, usedAt: new Date() },
                });
                await logSecurityEvent({
                  userId: user.id,
                  event: 'BACKUP_CODE_USED',
                });
                break;
              }
            }
          }

          if (!isTotpValid && !isBackupCodeValid) {
            await logSecurityEvent({
              userId: user.id,
              event: 'MFA_FAILED',
              details: { reason: 'Invalid TOTP or backup code' },
            });
            throw new Error('Invalid 2FA code.');
          }

          await logSecurityEvent({
            userId: user.id,
            event: 'MFA_VERIFIED',
          });
        }

        // 5. Successful Authentication: Reset lockout counters
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
            },
          });
        }

        await logSecurityEvent({
          userId: user.id,
          event: 'LOGIN_SUCCESS',
        });

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          verified: user.verified,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "email profile",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        const isVerified = profile?.email_verified ?? false;
        if (!isVerified) return false;

        // Ensure user profile record exists for unified email identity
        if (user?.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              include: { profile: true },
            });
            if (dbUser && !dbUser.profile) {
              await prisma.profile.create({
                data: {
                  authorId: dbUser.id,
                  email: dbUser.email,
                  about: `Profile for ${dbUser.name || 'User'}`,
                  image: dbUser.image,
                },
              });
            }
          } catch (err) {
            console.warn('[auth:google:profile_sync_warning]', err);
          }
        }

        return true;
      }
      return true;
    },
  },
});
