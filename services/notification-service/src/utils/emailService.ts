import nodemailer from "nodemailer";
import { Logger } from "../../shared/utils/logger";

const logger = new Logger("EmailService");

let transporter: nodemailer.Transporter | null = null;

export const initEmailService = async () => {
  try {
    // For prototype, use console logging instead of actual email
    // In production, configure with real SMTP settings
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info("Email service initialized with SMTP");
    } else {
      logger.info("Email service initialized in console mode (no SMTP configured)");
    }
  } catch (error) {
    logger.error("Failed to initialize email service", error);
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "noreply@swapit.com",
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error);
    }
  } else {
    // Console mode for prototype
    logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
    logger.info(`[EMAIL BODY] ${html}`);
  }
};
