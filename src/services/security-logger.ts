import prisma from '../../prisma/prisma';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_CHANGED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFIED'
  | 'MFA_FAILED'
  | 'BACKUP_CODE_USED'
  | 'SIGNUP_ATTEMPT';

export async function logSecurityEvent(params: {
  userId?: number | null;
  event: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | string | null;
}): Promise<void> {
  try {
    const detailsStr =
      typeof params.details === 'object' && params.details !== null
        ? JSON.stringify(params.details)
        : (params.details as string | null);

    await prisma.securityLog.create({
      data: {
        userId: params.userId ?? null,
        event: params.event,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        details: detailsStr,
      },
    });
  } catch (err) {
    // Audit logging should never crash the main application thread
    console.error('Failed to write security log:', err);
  }
}
