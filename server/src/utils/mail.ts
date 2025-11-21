import { config } from "dotenv";
import nodemailer from "nodemailer";

config();

const isDevelopment = process.env.NODE_ENV === "development";

const transporter = nodemailer.createTransport(
  isDevelopment
    ? {
        host: process.env.MAILHOG_SMTP_HOST || "localhost",
        port: Number(process.env.MAILHOG_SMTP_PORT) || 1025,
      }
    : {
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      }
);

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text: string = ""
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Loop <noreply@loop.com>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Helper function to send OTP email
export const sendOTPEmail = async (to: string, otp: string) => {
  const subject = "Verify Your Email - Loop";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Your OTP code is:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};
