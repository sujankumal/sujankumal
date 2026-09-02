import nodemailer from 'nodemailer';

/**
 * Email service helper for dispatching transactional emails.
 * Supports SMTP in production and console logging in development.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const isDev = process.env.NODE_ENV !== 'production';

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Development fallback
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (isDev) {
      console.log('\n================== [TRANSACTIONAL EMAIL] ==================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html.replace(/<[^>]*>/g, '')}`);
      console.log('===========================================================\n');

      return { success: true };
    }

    console.error('[EmailService] SMTP is not configured');

    return {
      success: false,
      error: 'Email service is not configured',
    };
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        'Sujan Kumal <no-reply@sujankumal.com.np>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[EmailService] SMTP delivery failed:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send email',
    };
  }
}