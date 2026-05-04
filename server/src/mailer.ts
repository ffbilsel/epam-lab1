import nodemailer, { Transporter } from 'nodemailer';
import { config } from './config';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!config.smtp.host) return null;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

export async function sendResetEmail(to: string, token: string): Promise<void> {
  const link = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const t = getTransporter();
  if (!t) {
    // Dev fallback: log to console so devs can copy the link.
    // eslint-disable-next-line no-console
    console.log(`[mailer] Password reset link for ${to}: ${link}`);
    return;
  }
  await t.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Reset your password',
    text: `Click the link below to reset your password (valid for ${config.resetTokenTtlMinutes} minutes):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>Click the link below to reset your password (valid for ${config.resetTokenTtlMinutes} minutes):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`,
  });
}
