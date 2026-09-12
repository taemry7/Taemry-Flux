/**
 * TAEMRY FLUX - Referral System Page (Phase 3)
 * Displays user's unique referral link, one-click copy, direct referrals list (Level 1),
 * team ads counter, and multi-tier commission analytics.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Layers,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Clock,
  MessageCircle,
  X,
  Send
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../config/milestones.config';

export default function Referrals({ onSelectTab }) {
  const { userStats } = useAuth();

  const [referralData, setReferralData] = useState({
    referralCode: '',
    referralLink: '',
    referralCount: userStats?.referralCount ?? 0,
    teamAdsCount: userStats?.teamAdsCount ?? 0,
    directReferrals: [],
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch referrals information
  const fetchReferralInfo = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/referrals/info');
      if (res.data?.success) {
        setReferralData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch referral info:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Smart Share Trigger: Web Share API if supported, or open Share Modal
  const handleShareLink = async () => {
    const shareTitle = 'Join TAEMRY FLUX';
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads and building your network! Use my referral code: ${referralData.referralCode || ''}`;
    const shareUrl = referralData.referralLink || window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads and building your network! Use my referral code: ${referralData.referralCode || ''}`;
    const shareUrl = referralData.referralLink || window.location.href;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Direct Telegram Share
  const handleTelegramShare = () => {
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads! Referral Code: ${referralData.referralCode || ''}`;
    const shareUrl = referralData.referralLink || window.location.href;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Affiliate & Downline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Referral Hub & Team Network
          </h1>
        </div>

        {/* Quick Share / Invite button */}
        <button
          id="btn-header-share-referral"
          onClick={handleShareLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#0c5963]/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Referral Link</span>
        </button>
      </div>

      {/* REFERRAL LINK HERO CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Your Personal Invitation Link
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#09353e]">
              Invite members to earn multi-level matching commission
            </h3>
            <p className="text-xs sm:text-sm text-[#526d72] leading-relaxed">
              Share your link with colleagues and team partners. Whenever any member in your 5-level direct chain watches an ad, you earn tiered matching commissions (L1: 25%, L2: 20%, L3: 15%, L4: 10%, L5: 5%) automatically.
            </p>
          </div>

          {/* Referral Code Badge */}
          <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e2dcce] flex flex-col items-center justify-center min-w-[180px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#798e92]">
              Referral Code
            </span>
            <span className="text-xl font-black font-mono text-[#0c5963] tracking-wider mt-0.5">
              {referralData.referralCode}
            </span>
          </div>
        </div>

        {/* Copy & Share input bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralData.referralLink}
              className="w-full py-3 pl-4 pr-10 bg-[#f7f5f0] border border-[#d8d1c3] rounded-2xl text-xs sm:text-sm font-mono text-[#09353e] font-semibold focus:outline-none select-all"
            />
          </div>

          {/* Copy Link Button */}
          <button
            id="btn-copy-referral"
            onClick={handleCopyLink}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer ${
              copied
                ? 'bg-[#059669] text-white shadow-none'
                : 'bg-[#09353e] hover:bg-[#052127] text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Dedicated Share Link Button */}
          <button
            id="btn-share-referral"
            onClick={handleShareLink}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-2xl bg-[#0c5963] hover:bg-[#08424b] text-white transition-all shadow-xs cursor-pointer"
            title="Share referral link"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>

          {/* Direct WhatsApp Share Button */}
          <button
            id="btn-share-whatsapp"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs cursor-pointer"
            title="Share directly to WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* THREE STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Direct Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Direct Referrals (L1)
            </span>
            <Users className="w-4 h-4 text-[#0c5963]" />
          </div>
          <p className="text-2xl font-black text-[#09353e]">
            {referralData.referralCount}
          </p>
          <p className="text-xs text-[#526d72] mt-1">
            Active directly invited accounts
          </p>
        </div>

        {/* Team Ads Counter */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Total Team Ads
            </span>
            <Layers className="w-4 h-4 text-[#e89b27]" />
          </div>
          <p className="text-2xl font-black text-[#e89b27]">
            {formatNumber(referralData.teamAdsCount)}
          </p>
          <p className="text-xs text-[#526d72] mt-1">
            Unlimited depth team accumulation
          </p>
        </div>

        {/* Commission Rate */}
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286]">
              Upline Matching
            </span>
            <Award className="w-4 h-4 text-[#0c5963]" />
          </div>
          <p className="text-2xl font-black text-[#0c5963]">
            Up to 25%
          </p>
          <p className="text-xs text-[#526d72] mt-1">
            Tiered match (25% down to 5%) across 5 levels
          </p>
        </div>
      </div>

      {/* DIRECT REFERRALS TABLE */}
      <div className="bg-white rounded-3xl border border-[#e4ded2] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#eee8dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#09353e]">
              Direct Downline Partners (Level 1)
            </h3>
            <p className="text-xs text-[#627a7f] mt-0.5">
              Verified members registered through your referral invitation
            </p>
          </div>

          <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-3 py-1 rounded-full border border-[#b8dfd7] self-start sm:self-auto">
            {referralData.directReferrals?.length || 0} Registered Partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-[11px] font-bold uppercase tracking-wider text-[#73888c] border-b border-[#eee8dd]">
                <th className="py-3.5 px-6">Member Name</th>
                <th className="py-3.5 px-6">Account Email</th>
                <th className="py-3.5 px-6">Active Package</th>
                <th className="py-3.5 px-6 text-right">Lifetime Ads</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2ede4] text-xs">
              {referralData.directReferrals && referralData.directReferrals.length > 0 ? (
                referralData.directReferrals.map((member, idx) => (
                  <tr key={member.id || idx} className="hover:bg-[#faf8f5] transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-[#09353e]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center font-black text-xs">
                          {member.name ? member.name.charAt(0) : 'M'}
                        </div>
                        <span>{member.name || 'Anonymous Member'}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 font-mono text-[#546d72]">
                      {member.email}
                    </td>

                    {/* Package */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-[#faf4ea] text-[#b45309] border border-[#fed7aa]">
                        {member.package || 'Bronze'}
                      </span>
                    </td>

                    {/* Lifetime Ads */}
                    <td className="py-4 px-6 text-right font-black font-mono text-[#09353e]">
                      {formatNumber(member.lifetimeAds || 0)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                        <UserCheck className="w-3 h-3" />
                        <span>{member.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-6 text-right text-[#73888c]">
                      {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6e8488]">
                    <Users className="w-8 h-8 text-[#a9b9bc] mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#09353e]">No direct referrals yet</p>
                    <p className="text-xs text-[#6e8488] max-w-sm mx-auto mt-1">
                      Share your referral code or link with new members. They will appear here once they register.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMISSION PROTOCOL SUMMARY */}
      <div className="p-6 rounded-3xl bg-[#f5f1e8] border border-[#e4ded2] grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#0c5963] mb-1.5">
            5-Level Tiered Matching Commission
          </h4>
          <p className="text-xs text-[#526d72] leading-relaxed">
            Every time any member in your downlines completes an ad view, you instantly receive tiered commissions: Level 1 (25%), Level 2 (20%), Level 3 (15%), Level 4 (10%), and Level 5 (5%) based on their ad reward. There is no cap on daily referral earnings.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#e89b27] mb-1.5">
            Unlimited Depth Team Milestones
          </h4>
          <p className="text-xs text-[#526d72] leading-relaxed">
            Every ad watched by any member across your entire lineage—regardless of depth—increments your <strong>Team Ads</strong> counter by +1. This powers your Team Milestone Ladder unlocks with rewards up to $150,000.
          </p>
        </div>
      </div>

      {/* SHARE REFERRAL MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#e4ded2] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 p-2 text-[#798e92] hover:text-[#09353e] hover:bg-[#f3eee5] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#09353e]">Share Referral Link</h3>
                <p className="text-xs text-[#526d72]">Earn 5-level matching commission on all ad views</p>
              </div>
            </div>

            {/* Referral Code Display */}
            <div className="bg-[#faf8f5] p-3.5 rounded-2xl border border-[#e2dcce] mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#798e92] block">Your Referral Code</span>
                <span className="text-base font-black font-mono text-[#0c5963]">{referralData.referralCode}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#09353e] hover:bg-[#052127] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Social Share Channels */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#798e92] block">Choose Channel</span>
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <button
                  id="btn-modal-share-whatsapp"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  id="btn-modal-share-telegram"
                  onClick={handleTelegramShare}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#229ED9] hover:bg-[#1c8ec4] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>
              </div>
            </div>

            {/* Direct Link Copy Bar */}
            <div className="mt-5 pt-4 border-t border-[#eee9df]">
              <button
                id="btn-modal-copy-link"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#0c5963]/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Full Invitation Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
