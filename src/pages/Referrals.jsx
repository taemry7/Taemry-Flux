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
  Clock
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../config/milestones.config';

export default function Referrals({ onSelectTab }) {
  const { userStats } = useAuth();

  const [referralData, setReferralData] = useState({
    referralCode: 'FLUX-PRO123',
    referralLink: window.location.origin + '/#/?ref=FLUX-PRO123',
    referralCount: userStats?.referralCount || 3,
    teamAdsCount: userStats?.teamAdsCount || 5000,
    directReferrals: [],
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#0c5963]/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Share Referral Link'}</span>
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
              Invite members to earn 50% matching commission
            </h3>
            <p className="text-xs sm:text-sm text-[#526d72] leading-relaxed">
              Share your link with colleagues and team partners. Whenever any member in your 5-level direct chain watches an ad, you earn a 50% commission match automatically.
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

        {/* Copy input bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralData.referralLink}
              className="w-full py-3 pl-4 pr-10 bg-[#f7f5f0] border border-[#d8d1c3] rounded-2xl text-xs sm:text-sm font-mono text-[#09353e] font-semibold focus:outline-none select-all"
            />
          </div>
          <button
            id="btn-copy-referral"
            onClick={handleCopyLink}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer ${
              copied
                ? 'bg-[#059669] text-white shadow-none'
                : 'bg-[#09353e] hover:bg-[#052127] text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
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
            50% Match
          </p>
          <p className="text-xs text-[#526d72] mt-1">
            Across 5 direct sponsor levels
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
            5-Level Matching Commission
          </h4>
          <p className="text-xs text-[#526d72] leading-relaxed">
            Every time any member in your Level 1 to Level 5 downlines completes a 60-second ad view, you instantly receive a 50% commission match based on the base ad reward. There is no cap on daily referral earnings.
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
    </div>
  );
}
