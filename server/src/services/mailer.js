'use strict';

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

async function sendPasswordResetEmail(email, resetUrl) {
  const t = getTransporter();
  if (!t) {
    // Dev fallback: log to console so the developer can use the link.
    // eslint-disable-next-line no-console
    console.log(`[mailer:dev] password reset for ${email}: ${resetUrl}`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: email,
    subject: 'Reset your password',
    text: `Click the link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Click the link to reset your password:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you did not request this, ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };
