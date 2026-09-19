/**
 * Email Service
 * Abstraction over email providers:
 * - console: dev fallback, prints to terminal
 * - ethereal: Nodemailer test account
 * - smtp: real SMTP
 */
const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const provider = process.env.EMAIL_PROVIDER || 'console';

  if (provider === 'console') {
    // Null transport — just log
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  if (provider === 'ethereal') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`📧 Ethereal email: ${testAccount.user}`);
    return transporter;
  }

  // SMTP
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  const from = process.env.SMTP_FROM || 'AlumNetra <no-reply@alumnetra.local>';

  if (provider === 'console') {
    console.log('\n📧 ===== EMAIL (console mode) =====');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || '(HTML only)'}`);
    console.log('====================================\n');
    return { messageId: `console-${Date.now()}`, preview: null };
  }

  const t = await getTransporter();
  const info = await t.sendMail({ from, to, subject, html, text });

  if (provider === 'ethereal') {
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Email preview: ${preview}`);
    return { messageId: info.messageId, preview };
  }

  return { messageId: info.messageId, preview: null };
}

// ===== Email Templates =====

function sendOTPEmail({ to, name, otp, purpose }) {
  const purposes = {
    email_verification: {
      subject: 'Verify your AlumNetra email',
      action: 'verify your email address',
    },
    password_reset: {
      subject: 'Reset your AlumNetra password',
      action: 'reset your password',
    },
    mfa_login: {
      subject: 'AlumNetra login verification code',
      action: 'complete your login',
    },
  };

  const info = purposes[purpose] || { subject: 'Your AlumNetra OTP', action: 'proceed' };

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#1a4480 0%,#2563eb 100%);padding:32px 40px;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">AlumNetra</h1>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">TCET Alumni Network</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hello <strong>${name}</strong>,</p>
                <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                  Use the verification code below to ${info.action}.
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <div style="background:#f0f4ff;border:2px dashed #3b82f6;border-radius:10px;padding:24px;text-align:center;margin:0 0 32px;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your OTP</p>
                  <p style="margin:0;color:#1a4480;font-size:42px;font-weight:800;letter-spacing:12px;">${otp}</p>
                </div>
                <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
                  Do not share this code with anyone. AlumNetra staff will never ask for your OTP.
                </p>
                <p style="margin:0;color:#9ca3af;font-size:13px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                  © ${new Date().getFullYear()} AlumNetra — Thakur College of Engineering and Technology.<br>
                  This is an automated message. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const text = `Hello ${name},\n\nYour AlumNetra OTP to ${info.action} is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— AlumNetra Team`;

  return sendEmail({ to, subject: info.subject, html, text });
}

function sendVerificationStatusEmail({ to, name, status, reason }) {
  const messages = {
    approved: {
      subject: '✅ Your AlumNetra account has been verified!',
      body: 'Great news! Your identity has been verified and your account is now active. You can now access all features of AlumNetra.',
    },
    rejected: {
      subject: '❌ AlumNetra verification update',
      body: `We were unable to verify your identity at this time. Reason: ${reason || 'Please contact support for details.'}`,
    },
    resubmission_required: {
      subject: '⚠️ Action required: AlumNetra verification',
      body: `Your verification application needs attention. ${reason || 'Please log in and resubmit your documents.'} `,
    },
  };

  const info = messages[status] || { subject: 'AlumNetra account update', body: 'Your account status has been updated.' };

  const html = `
  <body style="font-family:Arial,sans-serif;padding:40px;background:#f5f5f5;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;">
      <h2 style="color:#1a4480;">AlumNetra</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p style="color:#374151;">${info.body}</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#1a4480;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
        Go to Dashboard
      </a>
      <p style="margin-top:32px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} AlumNetra</p>
    </div>
  </body>
  `;

  return sendEmail({ to, subject: info.subject, html, text: info.body });
}

function sendDonationReceiptEmail({ to, name, donationId, campaignTitle, amount, receiptUrl }) {
  const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const html = `
  <body style="font-family:Arial,sans-serif;padding:40px;background:#f5f5f5;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;">
      <h2 style="color:#1a4480;">AlumNetra</h2>
      <h3 style="color:#059669;">Contribution Confirmed 🎉</h3>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for your generous contribution to the TCET community.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Campaign:</strong> ${campaignTitle}</p>
        <p style="margin:0 0 8px;"><strong>Amount:</strong> ${formatted}</p>
        <p style="margin:0 0 8px;"><strong>Reference ID:</strong> ${donationId}</p>
        <p style="margin:0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      <a href="${process.env.CLIENT_URL}/contributions/receipt/${donationId}" 
         style="display:inline-block;background:#1a4480;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View Receipt
      </a>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Your contribution makes a real difference to TCET students. Thank you for giving back!
      </p>
      <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} AlumNetra</p>
    </div>
  </body>
  `;

  return sendEmail({
    to,
    subject: `Contribution receipt — ${campaignTitle}`,
    html,
    text: `Thank you for contributing ${formatted} to ${campaignTitle}. Reference: ${donationId}`,
  });
}

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendVerificationStatusEmail,
  sendDonationReceiptEmail,
};
