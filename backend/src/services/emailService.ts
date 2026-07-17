import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) {
    // Ethereal test account fallback (dev only)
    logger.warn('[emailService] SMTP_HOST not set — emails will be logged to console only');
    return {
      sendMail: async (opts: nodemailer.SendMailOptions) => {
        logger.info(`[EMAIL STUB] To: ${opts.to} | Subject: ${opts.subject}\n${opts.text ?? opts.html ?? ''}`);
        return { messageId: 'stub' };
      },
    } as unknown as nodemailer.Transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

export interface SendMailOpts {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(opts: SendMailOpts): Promise<void> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: env.SMTP_FROM || `"PRMS" <noreply@prms.local>`,
      to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
  } catch (err) {
    logger.error('[emailService] Failed to send email:', err);
    // Don't throw — email failure should not crash the request
  }
}
