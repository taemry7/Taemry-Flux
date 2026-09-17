/**
 * TAEMRY FLUX - Email & Admin Alert Service (Phase 7)
 * Handles automated email alerts for critical system errors,
 * scheduled DAU & financial performance reports, and support ticket user notifications.
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';

let transporter = null;
let nodemailerLib = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'support.taemryflux@gmail.com';
  // Clean app password (remove spaces if pasted with spaces)
  const rawPass = process.env.SMTP_PASS || 'wshvsmniwfjengii';
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

  if (host && user && pass) {
    try {
      if (!nodemailerLib) {
        const mod = await import('nodemailer');
        nodemailerLib = mod.default || mod;
      }
      transporter = nodemailerLib.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      console.log('[EmailService] SMTP transporter initialized successfully for:', user);
      return transporter;
    } catch (err) {
      console.warn('[EmailService] Failed to initialize SMTP transporter:', err.message);
    }
  }

  // Non-blocking mock fallback when SMTP credentials are not yet configured in environment
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('[EmailService (Preview/Mock Mode)] Would send email:');
      console.log(`  To: ${mailOptions.to}`);
      console.log(`  Subject: ${mailOptions.subject}`);
      console.log(`  Preview: ${(mailOptions.text || mailOptions.html || '').substring(0, 120)}...`);
      return { messageId: `mock-${Date.now()}` };
    },
  };

  return transporter;
};

// Branded From address (Display Name: "TAEMRY FLUX", Address: support.taemryflux@gmail.com)
const FROM_ADDRESS = process.env.SMTP_FROM || '"TAEMRY FLUX" <support.taemryflux@gmail.com>';
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'mistrtaimoor@gmail.com';

/**
 * 1. Send Critical Error Alert to Platform Admin
 */
export async function sendAdminErrorAlert({ error, route, method, user, stack, reqBody }) {
  try {
    const client = await getTransporter();
    const timestamp = new Date().toUTCString();

    const subject = `[CRITICAL ALERT] TAEMRY FLUX Error on ${method || 'GET'} ${route || 'unknown'}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: #991b1b; padding: 18px 24px;">
          <h2 style="margin: 0; font-size: 18px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Critical System Error Detected</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #fecaca;">TAEMRY FLUX Production Runtime &bull; ${timestamp}</p>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <p style="margin-top: 0;"><strong style="color: #38bdf8;">Route:</strong> <code style="background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #f43f5e;">${method || 'REQ'} ${route || 'N/A'}</code></p>
          <p><strong style="color: #38bdf8;">User Context:</strong> ${user ? `${user.email || user.uid} (UID: ${user.uid})` : 'Anonymous / Guest'}</p>
          <p><strong style="color: #38bdf8;">Error Message:</strong> <span style="color: #fb7185; font-weight: bold;">${error?.message || error || 'Unknown failure'}</span></p>
          
          <div style="margin-top: 16px;">
            <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Stack Trace:</strong>
            <pre style="background: #020617; border: 1px solid #1e293b; color: #cbd5e1; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto; white-space: pre-wrap;">${stack || error?.stack || 'No stack trace provided'}</pre>
          </div>

          ${reqBody ? `
            <div style="margin-top: 16px;">
              <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Request Payload:</strong>
              <pre style="background: #020617; border: 1px solid #1e293b; color: #cbd5e1; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto;">${typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody, null, 2)}</pre>
            </div>
          ` : ''}
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
            This is an automated alert dispatched by TAEMRY FLUX Phase 7 monitoring engine.
          </div>
        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: ADMIN_ALERT_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send admin error alert:', err.message);
    return null;
  }
}

/**
 * 2. Send Daily Active Users (DAU) & Platform Health Summary Report to Admin
 */
export async function sendDailyReportEmail(stats) {
  try {
    const client = await getTransporter();
    const dateStr = stats.date || new Date().toISOString().split('T')[0];
    const subject = `[DAILY HEALTH REPORT] TAEMRY FLUX Metrics - ${dateStr}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: #0284c7; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 18px; color: #ffffff;">TAEMRY FLUX &bull; Daily Platform Report</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #bae6fd;">Summary for ${dateStr} (Generated at 08:00 AM UTC)</p>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div style="background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Daily Active Users (DAU)</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold; color: #38bdf8;">${stats.dauCount || 0}</p>
            </div>
            <div style="background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">New User Signups</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold; color: #10b981;">+${stats.newUsersCount || 0}</p>
            </div>
            <div style="background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Approved Deposits</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold; color: #34d399;">$${Number(stats.totalRevenue || 0).toFixed(2)} USD</p>
            </div>
            <div style="background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Paid Withdrawals</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold; color: #f59e0b;">$${Number(stats.totalPayouts || 0).toFixed(2)} USD</p>
            </div>
          </div>

          <div style="background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px; font-size: 13px; color: #f8fafc; text-transform: uppercase;">Support & Operational Status</h4>
            <p style="margin: 4px 0; font-size: 13px;">Pending Support Tickets: <strong style="color: ${stats.pendingTicketsCount > 0 ? '#f43f5e' : '#10b981'};">${stats.pendingTicketsCount || 0}</strong></p>
            <p style="margin: 4px 0; font-size: 13px;">Pending Deposits: <strong>${stats.pendingDeposits || 0}</strong></p>
            <p style="margin: 4px 0; font-size: 13px;">Pending Withdrawals: <strong>${stats.pendingWithdrawals || 0}</strong></p>
            <p style="margin: 4px 0; font-size: 13px;">Total Ads Watched Today: <strong>${stats.todayAdsCount || 0}</strong></p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://taemryflux.com/#/admin" style="background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">
              Open Admin Control Center
            </a>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center;">
            TAEMRY FLUX Automated System &bull; Phase 7 Maintenance
          </div>
        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: ADMIN_ALERT_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send daily report email:', err.message);
    return null;
  }
}

/**
 * 3. Send Support Ticket Update Notification to User
 */
export async function sendTicketStatusUpdateEmail({ userEmail, ticketId, subject, status, reply }) {
  try {
    if (!userEmail) return null;
    const client = await getTransporter();

    const emailSubject = `[Ticket ${ticketId}] Status Update: ${status.toUpperCase()} - TAEMRY FLUX Support`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; color: #0a353f; border-radius: 12px; overflow: hidden; border: 1px solid #e2dbcd;">
        <div style="background: #0c5963; padding: 20px 24px; color: white;">
          <h2 style="margin: 0; font-size: 18px;">TAEMRY FLUX Support</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #bfe3dc;">Ticket #${ticketId}</p>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <p>Hello,</p>
          <p>The status of your support ticket regarding <strong>"${subject}"</strong> has been updated to: <span style="background: #e6f4f1; color: #0c5963; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px;">${status}</span>.</p>
          
          ${reply ? `
            <div style="background: #ffffff; border-left: 4px solid #0c5963; padding: 14px; border-radius: 0 8px 8px 0; margin: 18px 0; border-top: 1px solid #eee8dc; border-right: 1px solid #eee8dc; border-bottom: 1px solid #eee8dc;">
              <strong style="color: #0c5963; font-size: 12px; text-transform: uppercase;">Official Admin Response:</strong>
              <p style="margin: 6px 0 0; font-size: 13px; color: #16363d; white-space: pre-wrap;">${reply}</p>
            </div>
          ` : ''}

          <p style="margin-top: 20px; font-size: 13px; color: #516b71;">
            You can review the complete history of your ticket at any time by visiting the Support section in your dashboard.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e7e0d3; font-size: 11px; color: #81989c; text-align: center;">
            Thank you for being a valued member of TAEMRY FLUX.
          </div>
        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: userEmail,
      subject: emailSubject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send ticket update email:', err.message);
    return null;
  }
}

/**
 * 4. Send Branded Password Reset Email (Zero Attachments, Zero Firebase Mention, App-like Card)
 */
export async function sendCustomPasswordResetEmail({ userEmail, resetLink }) {
  try {
    if (!userEmail) return null;
    const client = await getTransporter();

    const subject = 'Reset Your TAEMRY FLUX Password';
    const html = `
      <div style="background-color: #f0f5f4; padding: 40px 14px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; margin: 0;">
        <div style="max-width: 490px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; border: 1px solid #d4e5e1; box-shadow: 0 12px 32px rgba(12, 89, 99, 0.08);">
          
          <!-- App-Like Teal/Emerald Header (Clean Typography, Zero Logo) -->
          <div style="background: linear-gradient(135deg, #072e38 0%, #0c5963 50%, #0f766e 100%); padding: 32px 24px; text-align: center;">
            <div style="text-align: center; line-height: 1;">
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">TAEMRY </span>
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #2dd4bf; background-color: #062b32; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; border: 1px solid rgba(45, 212, 191, 0.35); vertical-align: middle;">FLUX</span>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px; color: #1e293b; font-size: 14px; line-height: 1.65;">
            <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #0c5963;">Hello,</p>
            <p style="color: #334155; margin-bottom: 8px;">
              We received a request to reset the password for your <strong>TAEMRY FLUX</strong> account.
            </p>
            <p style="color: #475569; margin-top: 0; margin-bottom: 26px;">
              Click the button below to choose a new, secure password:
            </p>
            
            <!-- App-Style Emerald/Teal Action Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #0c5963 0%, #0f766e 100%); color: #ffffff; padding: 14px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(12, 89, 99, 0.35); text-align: center;">
                Reset Password
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e8f0ee; font-size: 12px; color: #64748b; line-height: 1.6;">
              Best regards,<br>
              <strong style="color: #0c5963; font-size: 13px;">Team TAEMRY FLUX</strong><br>
              <span style="font-size: 11px; color: #94a3b8;">Please do not reply directly to this email</span>
            </div>
          </div>

        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send password reset email:', err.message);
    return null;
  }
}

/**
 * 5. Send Branded Verification Email (New User Registration)
 */
export async function sendCustomVerificationEmail({ userEmail, userName, verifyLink }) {
  try {
    if (!userEmail) return null;
    const client = await getTransporter();

    const subject = 'Verify Your TAEMRY FLUX Account Email';
    const html = `
      <div style="background-color: #f0f5f4; padding: 40px 14px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; margin: 0;">
        <div style="max-width: 490px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; border: 1px solid #d4e5e1; box-shadow: 0 12px 32px rgba(12, 89, 99, 0.08);">
          
          <!-- App-Like Teal/Emerald Header (Clean Typography, Zero Logo) -->
          <div style="background: linear-gradient(135deg, #072e38 0%, #0c5963 50%, #0f766e 100%); padding: 32px 24px; text-align: center;">
            <div style="text-align: center; line-height: 1;">
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">TAEMRY </span>
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #2dd4bf; background-color: #062b32; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; border: 1px solid rgba(45, 212, 191, 0.35); vertical-align: middle;">FLUX</span>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px; color: #1e293b; font-size: 14px; line-height: 1.65;">
            <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #0c5963;">Welcome, ${userName || 'Member'}!</p>
            <p style="color: #334155; margin-bottom: 8px;">
              Thank you for creating your account on <strong>TAEMRY FLUX</strong>. We're excited to welcome you!
            </p>
            <p style="color: #475569; margin-top: 0; margin-bottom: 26px;">
              Please click the button below to verify your email address and activate your member security privileges:
            </p>
            
            <!-- App-Style Emerald/Teal Action Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${verifyLink}" style="background: linear-gradient(135deg, #0c5963 0%, #0f766e 100%); color: #ffffff; padding: 14px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(12, 89, 99, 0.35); text-align: center;">
                Verify Email Address
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e8f0ee; font-size: 12px; color: #64748b; line-height: 1.6;">
              Best regards,<br>
              <strong style="color: #0c5963; font-size: 13px;">Team TAEMRY FLUX</strong><br>
              <span style="font-size: 11px; color: #94a3b8;">Please do not reply directly to this email</span>
            </div>
          </div>

        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send verification email:', err.message);
    return null;
  }
}

/**
 * 6. Send Branded One-Time Password (OTP) Verification Code Email
 */
export async function sendCustomOtpEmail({ userEmail, otpCode }) {
  try {
    if (!userEmail || !otpCode) return null;
    const client = await getTransporter();

    const subject = `Your TAEMRY FLUX Verification Code: ${otpCode}`;
    const html = `
      <div style="background-color: #f0f5f4; padding: 40px 14px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; margin: 0;">
        <div style="max-width: 490px; margin: 0 auto; background: #ffffff; border-radius: 22px; overflow: hidden; border: 1px solid #d4e5e1; box-shadow: 0 12px 32px rgba(12, 89, 99, 0.08);">
          
          <!-- App-Like Teal/Emerald Header -->
          <div style="background: linear-gradient(135deg, #072e38 0%, #0c5963 50%, #0f766e 100%); padding: 32px 24px; text-align: center;">
            <div style="text-align: center; line-height: 1;">
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">TAEMRY </span>
              <span style="font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #2dd4bf; background-color: #062b32; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; border: 1px solid rgba(45, 212, 191, 0.35); vertical-align: middle;">FLUX</span>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px; color: #1e293b; font-size: 14px; line-height: 1.65;">
            <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #0c5963;">Hello,</p>
            <p style="color: #334155; margin-bottom: 8px;">
              Use the following one-time verification code to securely access your <strong>TAEMRY FLUX</strong> account:
            </p>
            
            <!-- OTP Box -->
            <div style="text-align: center; margin: 26px 0;">
              <div style="display: inline-block; background: #f0fdf9; border: 2px dashed #0d9488; border-radius: 16px; padding: 16px 36px;">
                <span style="font-family: monospace, 'Courier New', Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f766e;">${otpCode}</span>
              </div>
              <p style="margin-top: 10px; font-size: 12px; color: #64748b;">This code will expire in 10 minutes.</p>
            </div>

            <p style="color: #475569; font-size: 13px; margin-top: 16px;">
              If you did not request this code, you can safely ignore this email. Never share your verification code with anyone.
            </p>

            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e8f0ee; font-size: 12px; color: #64748b; line-height: 1.6;">
              Best regards,<br>
              <strong style="color: #0c5963; font-size: 13px;">Team TAEMRY FLUX</strong><br>
              <span style="font-size: 11px; color: #94a3b8;">Please do not reply directly to this email</span>
            </div>
          </div>

        </div>
      </div>
    `;

    return await client.sendMail({
      from: FROM_ADDRESS,
      to: userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send OTP email:', err.message);
    return null;
  }
}
