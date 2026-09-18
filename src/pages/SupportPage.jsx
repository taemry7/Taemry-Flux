import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LifeBuoy,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  Phone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient, { apiGet, apiPost } from '../api/client';
import GoogleAdSense from '../components/GoogleAdSense';

export default function SupportPage({ onNavigate }) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'in-progress' | 'resolved'
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }

  // FAQ open/close states
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSplash, setFaqSplash] = useState(null);

  const handleToggleFaq = (e, idx) => {
    setFaqSplash({
      id: Date.now() + Math.random(),
      idx,
    });
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  // Dynamic whitepaper & support info state
  const [supportInfo, setSupportInfo] = useState({
    email: 'support@taemryflux.com',
    whatsapp: '+92 300 0000000',
    telegram: '@TaemryFluxOfficial',
    hours: '24/7 Available (Response within 2-4 hours)',
  });
  const [faqsList, setFaqsList] = useState([]);

  const fetchTickets = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await apiGet('/support/my-tickets');
      if (res.success && Array.isArray(res.tickets)) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live support channels and FAQs
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await apiClient.get('/whitepaper');
        if (res.data?.success && res.data.whitepaper) {
          if (res.data.whitepaper.supportContact) {
            setSupportInfo(res.data.whitepaper.supportContact);
          }
          if (Array.isArray(res.data.whitepaper.faqs) && res.data.whitepaper.faqs.length > 0) {
            setFaqsList(res.data.whitepaper.faqs);
          }
        }
      } catch (e) {
        console.warn('Failed to load dynamic support desk info:', e.message);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Please fill in both the subject and your message.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await apiPost('/support/create', {
        subject: subject.trim(),
        priority,
        message: message.trim(),
      });

      if (res.success) {
        toast.success(`Ticket #${res.ticket.ticketId} created successfully.`);
        setFeedback({
          type: 'success',
          text: `Ticket #${res.ticket.ticketId} created successfully. Our team will review your inquiry shortly.`,
        });
        setSubject('');
        setMessage('');
        setPriority('normal');
        fetchTickets();
      } else {
        const errorMsg = res.message || 'Failed to submit ticket.';
        toast.error(errorMsg);
        setFeedback({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while submitting.';
      toast.error(errorMsg);
      setFeedback({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const faqs = [
    {
      q: 'How long does JazzCash / EasyPaisa deposit verification take?',
      a: 'Manual mobile wallet deposits are reviewed and credited within 10 to 60 minutes during standard business hours. Ensure your Transaction ID (TID) matches your SMS receipt exactly.',
    },
    {
      q: 'When do daily ad limits reset?',
      a: 'Daily ad viewing limits reset automatically every 24 hours at 00:00 UTC (5:00 AM Pakistan Standard Time). If your package is active, you can watch your allocated ads every day.',
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal threshold is 5.00 USD. Withdrawals are processed directly to your registered JazzCash, EasyPaisa, or Bank account with zero hidden fees.',
    },
    {
      q: 'How does the 5-Level referral commission work?',
      a: 'Direct ad view commissions are paid across 5 tiers: Level 1 awards 25%, Level 2 awards 20%, Level 3 awards 15%, Level 4 awards 10%, and Level 5 awards 5% of your downlines\' ad rewards.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5dfd2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-xs font-semibold text-[#0c5963] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] flex items-center gap-2.5">
              <LifeBuoy className="w-7 h-7 text-[#0c5963]" />
              Support & Help Desk
            </h1>
            <p className="text-sm text-[#526b70] mt-1">
              Need assistance with deposits, packages, or withdrawals? Open a support ticket below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-[#e2dbcd] hover:bg-[#f3eee4] rounded-xl text-[#09353e] transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Tickets</span>
            </button>
            <a
              href="mailto:admin@taemryflux.com"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0c5963] hover:bg-[#09424a] text-white rounded-xl transition-all shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Direct Email</span>
            </a>
          </div>
        </div>

        {/* Official Channels Banner */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c2027] border border-[#e4ded2] dark:border-[#173740] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d5963] dark:text-[#38bdf8]">
                DIRECT HELPLINES
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#09353e] dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                <span>Admin Support Desk Channels</span>
              </h3>
            </div>
            <span className="text-xs text-[#5a7277] dark:text-[#94a3b8] font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{supportInfo.hours}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <a
              href={`mailto:${supportInfo.email}`}
              className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] flex items-center gap-3 hover:border-[#0c5963] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#122e38] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-[#71868a] block">Email Inquiries</span>
                <span className="font-bold text-[#09353e] dark:text-white truncate block">{supportInfo.email}</span>
              </div>
            </a>

            {supportInfo.whatsapp && (
              <a
                href={supportInfo.whatsapp.startsWith('http') ? supportInfo.whatsapp : `https://wa.me/${supportInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] flex items-center gap-3 hover:border-emerald-500 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-[#71868a] block">WhatsApp Support</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">{supportInfo.whatsapp}</span>
                </div>
              </a>
            )}

            {supportInfo.telegram && (
              <a
                href={supportInfo.telegram.startsWith('http') ? supportInfo.telegram : `https://t.me/${supportInfo.telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] flex items-center gap-3 hover:border-sky-500 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-[#71868a] block">Telegram Channel</span>
                  <span className="font-bold text-sky-500 truncate block">{supportInfo.telegram}</span>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border ${
              feedback.type === 'success'
                ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm font-medium">{feedback.text}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Create Ticket Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e4ded2] shadow-xs">
              <h2 className="text-lg font-bold text-[#09353e] mb-1 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0c5963]" />
                Submit a Support Ticket
              </h2>
              <p className="text-xs text-[#5e777c] mb-5">
                Our support staff monitors all inquiries around the clock.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#09353e] mb-1 uppercase tracking-wider">
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., JazzCash deposit verification delay"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd4c5] bg-[#faf8f5] text-xs sm:text-sm text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-1 focus:ring-[#0c5963]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#09353e] mb-1 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd4c5] bg-[#faf8f5] text-xs sm:text-sm text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-1 focus:ring-[#0c5963]"
                  >
                    <option value="low">Low - General Question</option>
                    <option value="normal">Normal - Standard Inquiry</option>
                    <option value="high">High - Transaction Issue</option>
                    <option value="urgent">Urgent - Account Access / Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#09353e] mb-1 uppercase tracking-wider">
                    Detailed Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide relevant transaction IDs, package names, or details to help us resolve your issue quickly..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd4c5] bg-[#faf8f5] text-xs sm:text-sm text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-1 focus:ring-[#0c5963]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            </div>

            {/* Quick Contact & Safe Support Card */}
            <div className="bg-[#f2eee5] rounded-2xl p-5 border border-[#e3dccf] text-xs text-[#526b70] space-y-3">
              <div className="flex items-center gap-2 text-[#09353e] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#0c5963]" />
                Official Admin Verification
              </div>
              <p className="leading-relaxed">
                TAEMRY FLUX representatives will never ask for your account password or payment PIN. Never send money to unverified personal accounts.
              </p>
              <div className="pt-2 border-t border-[#dfd7c8] flex items-center justify-between text-[11px] text-[#6d8286]">
                <span>Official Support:</span>
                <span className="font-semibold text-[#09353e]">admin@taemryflux.com</span>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket List & Status Tracking */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e4ded2] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#09353e]">Your Support History</h2>
                  <p className="text-xs text-[#5e777c]">
                    Track status updates and review administrator responses.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#faf8f5] p-1 rounded-xl border border-[#e3ded2] text-xs">
                  {['all', 'open', 'in-progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                        statusFilter === st
                          ? 'bg-[#0c5963] text-white shadow-2xs'
                          : 'text-[#5d757a] hover:text-[#09353e]'
                      }`}
                    >
                      {st === 'in-progress' ? 'In Progress' : st}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#71868a]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0c5963]" />
                  Loading your tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#71868a] bg-[#faf8f5] rounded-xl border border-dashed border-[#e3dccf]">
                  <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-[#b0c4c8]" />
                  <p className="font-semibold text-[#09353e] mb-1">No support tickets found</p>
                  <p className="max-w-xs mx-auto">
                    {statusFilter === 'all'
                      ? 'You have not submitted any inquiries yet. Submit your first ticket on the left.'
                      : `No tickets matching filter "${statusFilter}".`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((t) => {
                    const isExpanded = expandedTicketId === t.ticketId;
                    return (
                      <div
                        key={t.ticketId}
                        className="rounded-xl border border-[#e6e0d4] bg-[#faf8f5] hover:border-[#0c5963]/30 transition-all overflow-hidden"
                      >
                        <div
                          onClick={() => setExpandedTicketId(isExpanded ? null : t.ticketId)}
                          className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#eef4f4] text-[#0c5963] border border-[#cbe1de]">
                                {t.ticketId}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  t.status === 'resolved'
                                    ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                                    : t.status === 'in-progress'
                                    ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]'
                                    : 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                                }`}
                              >
                                {t.status}
                              </span>

                              <span className="text-[10px] text-[#7a8e92] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(t.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-[#09353e] truncate">
                              {t.subject}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {t.adminReply && (
                              <span className="hidden sm:inline-block text-[10px] font-semibold bg-[#e6f4f1] text-[#0c5963] px-2 py-0.5 rounded-md">
                                Has Reply
                              </span>
                            )}
                            <div className="text-[#7c9195]">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="p-4 border-t border-[#eae3d5] bg-white text-xs space-y-4">
                            <div>
                              <span className="font-bold text-[#09353e] uppercase text-[10px] tracking-wider block mb-1">
                                Your Message:
                              </span>
                              <p className="text-[#3b5358] whitespace-pre-wrap leading-relaxed bg-[#faf8f5] p-3 rounded-lg border border-[#eee8dc]">
                                {t.message}
                              </p>
                            </div>

                            {t.adminReply ? (
                              <div className="bg-[#f0f9f8] p-3.5 rounded-xl border border-[#bfe3dc]">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-[#0c5963] text-xs flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-[#0c5963]" />
                                    Admin Response
                                  </span>
                                  {t.repliedAt && (
                                    <span className="text-[10px] text-[#6d8286]">
                                      {new Date(t.repliedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[#134048] whitespace-pre-wrap leading-relaxed">
                                  {t.adminReply}
                                </p>
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#71868a] italic flex items-center gap-1.5 bg-[#faf8f5] p-2.5 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-[#d97706]" />
                                Inquiry awaiting administrator review.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform FAQs */}
            <div className="bg-white rounded-2xl p-6 border border-[#e4ded2] shadow-xs">
              <h2 className="text-base font-bold text-[#09353e] mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0c5963]" />
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-[#5e777c] mb-4">
                Instant answers to the most common member inquiries.
              </p>

              <div className="space-y-2">
                {(faqsList.length > 0 ? faqsList : faqs).map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="border border-[#e7e1d5] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFaq(e, idx)}
                        className="w-full text-left p-3.5 bg-[#faf8f5] hover:bg-[#f3ede3] text-xs font-bold text-[#09353e] flex items-center justify-between gap-3 cursor-pointer transition-colors select-none group"
                      >
                        <span className="flex-1">{faq.q}</span>
                        <div className="relative shrink-0 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.06 : 1 }}
                            whileTap={{ scale: 0.88 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden transition-colors ${
                              isOpen
                                ? 'bg-[#0c5963] text-white shadow-xs'
                                : 'bg-[#ece5d8] text-[#0c5963] group-hover:bg-[#ded5c6]'
                            }`}
                          >
                            {/* Fluid circular splash ripple wave */}
                            <AnimatePresence>
                              {faqSplash && faqSplash.idx === idx && (
                                <motion.span
                                  key={faqSplash.id}
                                  initial={{ scale: 0, opacity: 0.9, filter: 'blur(0px)' }}
                                  animate={{ scale: 4.5, opacity: 0, filter: 'blur(10px)' }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="pointer-events-none absolute inset-0 m-auto rounded-full w-7 h-7 bg-gradient-to-r from-[#0c5963] to-[#10b981]"
                                />
                              )}
                            </AnimatePresence>

                            <ChevronDown className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                          </motion.div>
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="p-3.5 bg-white text-xs text-[#486368] leading-relaxed border-t border-[#e7e1d5] whitespace-pre-line">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* GOOGLE ADSENSE SUPPORT PAGE BANNER */}
        <GoogleAdSense label="Official Sponsor Network" format="auto" className="mt-8" />
      </div>
    </div>
  );
}
