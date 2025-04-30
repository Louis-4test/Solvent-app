import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

if (process.env.NODE_ENV !== 'development') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certs in dev/test
    }
  });
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Simulating email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      if (html) console.log(`HTML: ${html}`);
      return { message: 'Simulated email sent (dev mode)' };
    }

    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not configured');
    }

    const mailOptions = {
      from: `"Solvent App" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default {
  sendEmail
};
