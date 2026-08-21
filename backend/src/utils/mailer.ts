import nodemailer from 'nodemailer';
import { env } from '../config/env';

const isConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendMail(params: SendMailParams): Promise<{ sent: boolean }> {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn(`[mailer] SMTP no configurado. Se omite envio de correo a ${params.to}: ${params.subject}`);
    return { sent: false };
  }
  await transporter.sendMail({
    from: env.smtp.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments,
  });
  return { sent: true };
}
