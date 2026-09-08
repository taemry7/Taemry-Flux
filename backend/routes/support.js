/**
 * TAEMRY FLUX - User Support & Ticketing API Routes (Phase 7)
 * Enables members to submit support inquiries and track resolution,
 * and allows administrators to review, reply, and update ticket statuses.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import { sendTicketStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

/**
 * Record audit log helper
 */
async function recordAudit(db, entry) {
  try {
    await db.collection('auditLogs').add({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to record support audit log:', err.message);
  }
}

/**
 * 1. POST /api/support/create
 * Authenticated member creates a new support ticket
 */
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { subject, message, priority = 'normal' } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const db = getDb();
    const userId = req.user.uid;
    const userEmail = req.user.email || 'unknown@taemryflux.com';

    // Generate unique human-readable ticket ID: e.g. TKT-7X9AB
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newTicket = {
      ticketId,
      userId,
      userEmail,
      subject: subject.trim(),
      message: message.trim(),
      priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
      status: 'open', // 'open' | 'in-progress' | 'resolved'
      adminReply: null,
      repliedAt: null,
      repliedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in supportTickets collection
    await db.collection('supportTickets').doc(ticketId).set(newTicket);

    await recordAudit(db, {
      adminEmail: userEmail,
      action: 'create_support_ticket',
      targetUid: userId,
      targetEmail: userEmail,
      details: `Created ticket ${ticketId}: "${subject.trim().substring(0, 40)}"`,
    });

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will review it shortly.',
      ticket: newTicket,
    });
  } catch (error) {
    console.error('Error in POST /api/support/create:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create support ticket',
      message: error.message,
    });
  }
});

/**
 * 2. GET /api/support/my-tickets
 * Authenticated member retrieves all their submitted tickets
 */
router.get('/my-tickets', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.uid;

    const ticketsSnap = await db.collection('supportTickets').get();
    const userTickets = ticketsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((t) => t.userId === userId);

    userTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      tickets: userTickets,
      count: userTickets.length,
    });
  } catch (error) {
    console.error('Error in GET /api/support/my-tickets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      message: error.message,
    });
  }
});

/**
 * 3. GET /api/support/admin/all
 * Administrator retrieves all tickets across the platform with optional status filter
 */
router.get('/admin/all', verifyAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { status, search } = req.query;

    const ticketsSnap = await db.collection('supportTickets').get();
    let allTickets = ticketsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    if (status && status !== 'all') {
      allTickets = allTickets.filter((t) => t.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allTickets = allTickets.filter(
        (t) =>
          t.ticketId?.toLowerCase().includes(q) ||
          t.userEmail?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q)
      );
    }

    allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const metrics = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === 'open').length,
      inProgress: allTickets.filter((t) => t.status === 'in-progress').length,
      resolved: allTickets.filter((t) => t.status === 'resolved').length,
    };

    return res.json({
      success: true,
      tickets: allTickets,
      metrics,
    });
  } catch (error) {
    console.error('Error in GET /api/support/admin/all:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin support tickets',
      message: error.message,
    });
  }
});

/**
 * 4. PUT /api/support/admin/:ticketId/status
 * Administrator updates the ticket status and optionally appends an admin response
 */
router.put('/admin/:ticketId/status', verifyAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, adminReply } = req.body;

    if (!['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const db = getDb();
    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const existingTicket = doc.data();
    const updates = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (adminReply !== undefined && adminReply !== null) {
      updates.adminReply = adminReply.trim();
      updates.repliedAt = new Date().toISOString();
      updates.repliedBy = req.user.email;
    }

    await ticketRef.update(updates);

    // Send email alert to the user if ticket was updated with reply or resolved
    if (existingTicket.userEmail) {
      sendTicketStatusUpdateEmail({
        userEmail: existingTicket.userEmail,
        ticketId,
        subject: existingTicket.subject,
        status,
        reply: updates.adminReply || existingTicket.adminReply,
      }).catch((err) => console.warn('Ticket notification email failed:', err.message));
    }

    await recordAudit(db, {
      adminEmail: req.user.email,
      action: 'update_ticket_status',
      targetUid: existingTicket.userId,
      targetEmail: existingTicket.userEmail,
      details: `Updated ${ticketId} status to "${status}".`,
    });

    return res.json({
      success: true,
      message: `Ticket ${ticketId} updated to ${status}.`,
      ticket: {
        ...existingTicket,
        ...updates,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/support/admin/:ticketId/status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update ticket status',
      message: error.message,
    });
  }
});

/**
 * 5. POST /api/support/admin/:ticketId/reply
 * Administrator submits a reply to a user's ticket
 */
router.post('/admin/:ticketId/reply', verifyAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reply, resolveTicket = false } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const db = getDb();
    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const existingTicket = doc.data();
    const newStatus = resolveTicket ? 'resolved' : 'in-progress';

    const updates = {
      adminReply: reply.trim(),
      status: newStatus,
      repliedAt: new Date().toISOString(),
      repliedBy: req.user.email,
      updatedAt: new Date().toISOString(),
    };

    await ticketRef.update(updates);

    // Notify user via email
    if (existingTicket.userEmail) {
      sendTicketStatusUpdateEmail({
        userEmail: existingTicket.userEmail,
        ticketId,
        subject: existingTicket.subject,
        status: newStatus,
        reply: reply.trim(),
      }).catch((err) => console.warn('Ticket reply email failed:', err.message));
    }

    await recordAudit(db, {
      adminEmail: req.user.email,
      action: 'reply_support_ticket',
      targetUid: existingTicket.userId,
      targetEmail: existingTicket.userEmail,
      details: `Admin replied to ticket ${ticketId} (Status: ${newStatus}).`,
    });

    return res.json({
      success: true,
      message: 'Reply sent and user notified.',
      ticket: {
        ...existingTicket,
        ...updates,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/support/admin/:ticketId/reply:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reply to ticket',
      message: error.message,
    });
  }
});

export default router;
