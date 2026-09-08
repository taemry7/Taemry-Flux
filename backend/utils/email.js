/**
 * TAEMRY FLUX - Email & Admin Alert Service (Phase 7)
 * Handles automated email alerts for critical system errors,
 * scheduled DAU & financial performance reports, and support ticket user notifications.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Lazily create and cache the transporter
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    console.log('[EmailService] SMTP transporter initialized successfully for:', user);
  } else {
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
  }

  return transporter;
};

const FROM_ADDRESS = process.env.SMTP_FROM || '"TAEMRY FLUX Alerts" <no-reply@taemryflux.com>';
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'mistrtaemry@gmail.com';

/**
 * 1. Send Critical Error Alert to Platform Admin
 */
export async function sendAdminErrorAlert({ error, route, method, user, stack, reqBody }) {
  try {
    const client = getTransporter();
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
    const client = getTransporter();
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
    const client = getTransporter();

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
