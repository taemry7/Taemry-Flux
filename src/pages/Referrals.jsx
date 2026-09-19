/**
 * TAEMRY FLUX - Referral System Page (Phase 3)
 * Displays user's unique referral link using their Username (replacing random referral code),
 * provides 5 link format options with one-click copy, direct referrals list (Level 1),
 * team ads counter, multi-tier commission analytics, and live production network synchronization.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Send,
  AtSign,
  Link2,
  CheckCircle2,
  Sliders,
  Sparkle,
  HelpCircle,
  Eye
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../config/milestones.config';

export default function Referrals({ onSelectTab }) {
  const { currentUser, userStats } = useAuth();

  // Derive user's username
  const resolvedUsername = useMemo(() => {
    const raw =
      currentUser?.displayName ||
      currentUser?.name ||
      userStats?.username ||
      userStats?.name ||
      '';
    const clean = raw.trim().replace(/^@/, '');
    if (clean) return clean;
    return 'member';
  }, [currentUser, userStats]);

  const [activeUsername, setActiveUsername] = useState(resolvedUsername);

  useEffect(() => {
    if (resolvedUsername) {
      setActiveUsername(resolvedUsername);
    }
  }, [resolvedUsername]);

  const [referralData, setReferralData] = useState({
    referralCode: activeUsername,
    username: activeUsername,
    referralLink: '',
    referralCount: userStats?.referralCount ?? 0,
    teamAdsCount: userStats?.teamAdsCount ?? 0,
    directReferrals: [],
  });

  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState('direct-at-vanity');

  // Fetch referrals information from backend
  const fetchReferralInfo = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/referrals/info');
      if (res.data?.success) {
        const serverUser = res.data.username || res.data.referralCode;
        if (serverUser && serverUser.trim()) {
          setActiveUsername(serverUser.trim().replace(/^@/, ''));
        }
        setReferralData((prev) => ({
          ...prev,
          ...res.data,
          referralCode: serverUser || prev.referralCode,
          username: serverUser || prev.username,
        }));
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

  // Base domain / origin
  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://www.taemryflux.online';
  }, []);

  // 5 Referral Link Formats for user selection
  const linkFormats = useMemo(() => {
    const u = (activeUsername || 'username').replace(/^@/, '').trim();
    return [
      {
        id: 'direct-at-vanity',
        number: 1,
        title: 'Option 1: Ultra-Short Direct @Username Link (Recommended)',
        badge: 'Ultra Short & Clean',
        badgeColor: 'bg-[#ecfdf5] text-[#047857] dark:bg-[#064e3b] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]',
        description: `Cleanest and shortest direct link (${baseUrl}/@${u}). Clicking this link redirects visitors directly to the Sign Up page with your sponsor username attached.`,
        url: `${baseUrl}/@${encodeURIComponent(u)}`,
      },
      {
        id: 'hash-signup',
        number: 2,
        title: 'Option 2: Direct Sign Up Tab Hash Link',
        badge: 'Recommended Hash',
        badgeColor: 'bg-[#e6f4f1] text-[#0c5963] dark:bg-[#0c262e] dark:text-[#2dd4bf] border-[#b8ded7] dark:border-[#173740]',
        description: 'Opens directly to the registration tab with your username pre-filled and locked as the sponsor.',
        url: `${baseUrl}/#/login/signup?ref=${encodeURIComponent(u)}`,
      },
      {
        id: 'vanity-short-ref',
        number: 3,
        title: 'Option 3: Short /ref/ Vanity Link',
        badge: 'Vanity Ref',
        badgeColor: 'bg-[#f0f9ff] text-[#0369a1] dark:bg-[#082f49] dark:text-[#38bdf8] border-[#bae6fd] dark:border-[#0369a1]',
        description: 'Compact /ref/ link jo visitors ko foran sign up form par redirect karta hai.',
        url: `${baseUrl}/ref/${encodeURIComponent(u)}`,
      },
      {
        id: 'clean-query',
        number: 4,
        title: 'Option 4: Standard Clean Query URL',
        badge: 'Standard Query',
        badgeColor: 'bg-[#faf5ff] text-[#7e22ce] dark:bg-[#3b0764] dark:text-[#c084fc] border-[#e9d5ff] dark:border-[#6b21a8]',
        description: 'Standard query string URL without hash routing symbol, suitable for search and embed cards.',
        url: `${baseUrl}/?ref=${encodeURIComponent(u)}`,
      },
      {
        id: 'home-hash',
        number: 5,
        title: 'Option 5: Homepage Root Hash Link',
        badge: 'Landing Page',
        badgeColor: 'bg-[#fefce8] text-[#a16207] dark:bg-[#422006] dark:text-[#fef08a] border-[#fef08a] dark:border-[#713f12]',
        description: 'Brings visitors to the TAEMRY FLUX main homepage with your referral identity captured in the background.',
        url: `${baseUrl}/#/?ref=${encodeURIComponent(u)}`,
      },
    ];
  }, [baseUrl, activeUsername]);

  // Current active link based on selected format
  const currentActiveLink = useMemo(() => {
    const found = linkFormats.find((f) => f.id === selectedFormatId);
    return found ? found.url : linkFormats[0].url;
  }, [linkFormats, selectedFormatId]);

  // Copy handler with feedback
  const handleCopyLink = async (linkToCopy, id = 'main') => {
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2500);
    }
  };

  // Smart Share Trigger: Web Share API if supported, or open Share Modal
  const handleShareLink = async () => {
    handleShareLinkUrl(currentActiveLink);
  };

  const handleShareLinkUrl = async (urlToShare) => {
    const shareTitle = 'Join TAEMRY FLUX';
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads and building your network! Sponsor: @${activeUsername}`;
    const shareUrl = urlToShare || currentActiveLink;

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
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads and building your network! My sponsor username is: @${activeUsername}`;
    const shareUrl = currentActiveLink;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Direct Telegram Share
  const handleTelegramShare = () => {
    const shareText = `Join TAEMRY FLUX - Earn guaranteed daily rewards by viewing ads! Sponsor Username: @${activeUsername}`;
    const shareUrl = currentActiveLink;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Direct referrals to display (real team members)
  const displayReferrals = useMemo(() => {
    if (referralData.directReferrals && referralData.directReferrals.length > 0) {
      return referralData.directReferrals;
    }
    return [];
  }, [referralData.directReferrals]);

  const displayReferralCount = useMemo(() => {
    if (referralData.directReferrals && referralData.directReferrals.length > 0) {
      return referralData.directReferrals.length;
    }
    return referralData.referralCount || userStats?.referralCount || 0;
  }, [referralData.directReferrals, referralData.referralCount, userStats?.referralCount]);

  const displayTeamAdsCount = useMemo(() => {
    return referralData.teamAdsCount || userStats?.teamAdsCount || 0;
  }, [referralData.teamAdsCount, userStats?.teamAdsCount]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] dark:text-[#2dd4bf] bg-[#e6f4f1] dark:bg-[#0c262e] px-2.5 py-0.5 rounded-full border border-[#b8dfd7] dark:border-[#173740]">
              Affiliate &amp; Downline
            </span>
            <span className="hidden text-[11px] font-bold text-[#526d72] dark:text-[#94a3b8]">
              &bull; Sponsor: @{activeUsername}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] dark:text-white tracking-tight">
            Referral Hub &amp; Team Network
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
      <div className="bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 border border-[#e4ded2] dark:border-[#173740] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286] dark:text-[#94a3b8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0c5963] dark:text-[#2dd4bf]" />
              <span>Ultra-Short Direct @Username Link</span>
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#09353e] dark:text-white">
              Invite members to earn multi-level commissions
            </h3>
            <p className="text-xs sm:text-sm text-[#526d72] dark:text-[#94a3b8] leading-relaxed">
              Your referral code is your <strong>Username (@{activeUsername})</strong>. Earn 5-level direct referral commissions (20%, 10%, 5%, 3%, 2%) on package purchases, plus 5-level matching commissions (25%, 20%, 15%, 10%, 5%) on all their daily ad watches!
            </p>
          </div>

          {/* Referral Username Badge */}
          <div className="bg-[#faf8f5] dark:bg-[#07151a] p-4 sm:p-5 rounded-2xl border border-[#e2dcce] dark:border-[#173740] flex flex-col items-center justify-center min-w-[200px] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#798e92] dark:text-[#94a3b8] flex items-center gap-1">
              <AtSign className="w-3 h-3 text-[#0c5963] dark:text-[#2dd4bf]" />
              <span>Your Referral Code</span>
            </span>
            <span className="text-xl font-black font-mono text-[#0c5963] dark:text-[#2dd4bf] tracking-wider mt-1 flex items-center gap-1">
              @{activeUsername}
            </span>
            <span className="hidden text-[10px] text-[#718589] dark:text-[#64748b] mt-1 font-medium">
              Permanent Sponsor ID
            </span>
          </div>
        </div>

        {/* Format Selector Pills (Hidden per user request: "or 2 div ko hidden krdon Ok") */}
        <div className="hidden mt-6 pt-5 border-t border-[#eee8dd] dark:border-[#173740]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286] dark:text-[#94a3b8]">
              Select Active Link Format
            </span>
            <span className="text-[11px] text-[#0c5963] dark:text-[#2dd4bf] font-semibold">
              5 Link Options Available Below
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {linkFormats.map((fmt) => {
              const isSelected = selectedFormatId === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormatId(fmt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0c5963] text-white border-[#0c5963] shadow-xs'
                      : 'bg-[#faf8f5] dark:bg-[#07151a] text-[#4d666b] dark:text-[#94a3b8] border-[#e2dcce] dark:border-[#173740] hover:bg-[#f2ede4] dark:hover:bg-[#122b33]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center leading-4 text-[10px] font-mono">
                    {fmt.number}
                  </span>
                  <span>{fmt.title.split(':')[1] || fmt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy & Share input bar for Ultra-Short Direct @Username Link */}
        <div className="mt-6 pt-5 border-t border-[#eee8dd] dark:border-[#173740]">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={currentActiveLink}
                className="w-full py-3.5 pl-4 pr-10 bg-[#f7f5f0] dark:bg-[#07151a] border border-[#d8d1c3] dark:border-[#173740] rounded-2xl text-xs sm:text-sm font-mono text-[#09353e] dark:text-[#f1f5f9] font-semibold focus:outline-none select-all"
              />
            </div>

            {/* Copy Link Button */}
            <button
              id="btn-copy-referral"
              onClick={() => handleCopyLink(currentActiveLink, 'main')}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer ${
                copiedId === 'main'
                  ? 'bg-[#059669] text-white shadow-none'
                  : 'bg-[#09353e] dark:bg-[#0c262e] hover:bg-[#052127] dark:hover:bg-[#122b33] text-white border border-transparent dark:border-[#173740]'
              }`}
            >
              {copiedId === 'main' ? (
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
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold rounded-2xl bg-[#0c5963] hover:bg-[#08424b] text-white transition-all shadow-xs cursor-pointer"
              title="Share referral link"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Link</span>
            </button>

            {/* Direct WhatsApp Share Button */}
            <button
              id="btn-share-whatsapp"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs cursor-pointer"
              title="Share directly to WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALL 5 REFERRAL LINK OPTIONS DIRECT LIST (Hidden per user request: "or baqi ko hidden kardo ... or 2 div ko hidden krdon Ok") */}
      <div className="hidden bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-8 border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee8dd] dark:border-[#173740] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#0c5963] dark:text-[#2dd4bf]" />
              <span>Available Referral Link Formats</span>
            </h3>
            <p className="text-xs text-[#526d72] dark:text-[#94a3b8] mt-0.5">
              Review all 5 supported link options. You can tell us which format you prefer, or copy any of them directly:
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#2dd4bf] rounded-full border border-[#b8dfd7] dark:border-[#173740] self-start sm:self-auto">
            5 Formats Active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {linkFormats.map((fmt) => {
            const isCurrent = selectedFormatId === fmt.id;
            const isItemCopied = copiedId === fmt.id;
            return (
              <div
                key={fmt.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#f4f9f8] dark:bg-[#0b242b] border-[#0c5963]/50 dark:border-[#2dd4bf]/40 shadow-xs'
                    : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#e4ded2] dark:border-[#173740] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#0c5963] text-white flex items-center justify-center text-xs font-bold font-mono">
                      {fmt.number}
                    </span>
                    <h4 className="text-sm font-bold text-[#09353e] dark:text-white">
                      {fmt.title}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fmt.badgeColor}`}>
                      {fmt.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedFormatId(fmt.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0c5963] text-white border-[#0c5963]'
                          : 'bg-white dark:bg-[#0a1b22] text-[#09353e] dark:text-white border-[#d8d1c3] dark:border-[#1e4049] hover:bg-[#f1ede4]'
                      }`}
                    >
                      {isCurrent ? 'Selected (Active)' : 'Select'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(fmt.url, fmt.id)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                        isItemCopied
                          ? 'bg-[#059669] text-white'
                          : 'bg-[#09353e] dark:bg-[#122e37] text-white hover:bg-[#052127]'
                      }`}
                    >
                      {isItemCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isItemCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareLinkUrl(fmt.url)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-[#0c5963] hover:bg-[#08424b] text-white transition-all cursor-pointer shadow-xs"
                      title="Share this format"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#526d72] dark:text-[#94a3b8] mb-2 leading-relaxed">
                  {fmt.description}
                </p>

                <div className="bg-white dark:bg-[#051014] p-2.5 sm:p-3 rounded-xl border border-[#e2dcce] dark:border-[#173740] font-mono text-xs text-[#0c5963] dark:text-[#2dd4bf] font-semibold select-all break-all flex items-center justify-between gap-2">
                  <span>{fmt.url}</span>
                  <ExternalLink
                    className="w-3.5 h-3.5 text-[#768b90] hover:text-[#0c5963] dark:hover:text-[#2dd4bf] cursor-pointer shrink-0"
                    onClick={() => window.open(fmt.url, '_blank')}
                    title="Test open this link in new tab"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THREE STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Direct Referrals */}
        <div className="bg-white dark:bg-[#0a1b22] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286] dark:text-[#94a3b8]">
              Direct Referrals (L1)
            </span>
            <Users className="w-4 h-4 text-[#0c5963] dark:text-[#2dd4bf]" />
          </div>
          <p className="text-2xl font-black text-[#09353e] dark:text-white">
            {displayReferralCount}
          </p>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] mt-1">
            Active directly invited accounts
          </p>
        </div>

        {/* Team Ads Counter */}
        <div className="bg-white dark:bg-[#0a1b22] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286] dark:text-[#94a3b8]">
              Total Team Ads
            </span>
            <Layers className="w-4 h-4 text-[#e89b27]" />
          </div>
          <p className="text-2xl font-black text-[#e89b27]">
            {formatNumber(displayTeamAdsCount)}
          </p>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] mt-1">
            Unlimited depth team accumulation
          </p>
        </div>

        {/* Commission Rate */}
        <div className="bg-white dark:bg-[#0a1b22] rounded-3xl p-5 border border-[#e4ded2] dark:border-[#173740] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d8286] dark:text-[#94a3b8]">
              Upline Matching
            </span>
            <Award className="w-4 h-4 text-[#0c5963] dark:text-[#2dd4bf]" />
          </div>
          <p className="text-2xl font-black text-[#0c5963] dark:text-[#2dd4bf]">
            Up to 25%
          </p>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] mt-1">
            Tiered match (25% down to 5%) across 5 levels
          </p>
        </div>
      </div>

      {/* DIRECT REFERRALS TABLE */}
      <div className="bg-white dark:bg-[#0a1b22] rounded-3xl border border-[#e4ded2] dark:border-[#173740] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#eee8dd] dark:border-[#173740] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#09353e] dark:text-white">
              Direct Downline Partners (Level 1)
            </h3>
            <p className="text-xs text-[#627a7f] dark:text-[#94a3b8] mt-0.5">
              Verified members registered through your username (@{activeUsername})
            </p>
          </div>

          <span className="text-xs font-bold text-[#0c5963] dark:text-[#2dd4bf] bg-[#e6f4f1] dark:bg-[#0c262e] px-3 py-1 rounded-full border border-[#b8dfd7] dark:border-[#173740] self-start sm:self-auto">
            {displayReferrals.length} Registered Partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] dark:bg-[#07151a] text-[11px] font-bold uppercase tracking-wider text-[#73888c] dark:text-[#94a3b8] border-b border-[#eee8dd] dark:border-[#173740]">
                <th className="py-3.5 px-6">Member Name</th>
                <th className="py-3.5 px-6">Account Email</th>
                <th className="py-3.5 px-6">Active Package</th>
                <th className="py-3.5 px-6 text-right">Lifetime Ads</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2ede4] dark:divide-[#173740] text-xs">
              {displayReferrals && displayReferrals.length > 0 ? (
                displayReferrals.map((member, idx) => (
                  <tr key={member.id || idx} className="hover:bg-[#faf8f5] dark:hover:bg-[#0c242d] transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-[#09353e] dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#2dd4bf] flex items-center justify-center font-black text-xs">
                          {member.name ? member.name.charAt(0) : 'M'}
                        </div>
                        <div>
                          <span>{member.name || 'Anonymous Member'}</span>
                          {member.username && (
                            <span className="block text-[10px] text-[#768b90] dark:text-[#64748b] font-mono">
                              @{member.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 font-mono text-[#546d72] dark:text-[#94a3b8]">
                      {member.email}
                    </td>

                    {/* Package */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-[#faf4ea] dark:bg-[#301c0c] text-[#b45309] dark:text-[#fbbf24] border border-[#fed7aa] dark:border-[#78350f]">
                        {member.package || 'Bronze'}
                      </span>
                    </td>

                    {/* Lifetime Ads */}
                    <td className="py-4 px-6 text-right font-black font-mono text-[#09353e] dark:text-white">
                      {formatNumber(member.lifetimeAds || 0)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#065f46]">
                        <UserCheck className="w-3 h-3" />
                        <span>{member.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-6 text-right text-[#73888c] dark:text-[#94a3b8]">
                      {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6e8488] dark:text-[#94a3b8]">
                    <Users className="w-8 h-8 text-[#a9b9bc] dark:text-[#475569] mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#09353e] dark:text-white">No direct referrals yet</p>
                    <p className="text-xs text-[#6e8488] dark:text-[#94a3b8] max-w-sm mx-auto mt-1">
                      Share your referral username (@{activeUsername}) or link with new members. They will appear here once they register.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMISSION PROTOCOL SUMMARY */}
      <div className="p-6 rounded-3xl bg-[#f5f1e8] dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#0c5963] dark:text-[#2dd4bf] mb-1.5">
            5-Level Direct Refer Commission
          </h4>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] leading-relaxed">
            Earn instant multi-tier commission on every package purchase made in your downline: <strong>L1: 20%</strong>, <strong>L2: 10%</strong>, <strong>L3: 5%</strong>, <strong>L4: 3%</strong>, and <strong>L5: 2%</strong> credited directly to your wallet.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#0284c7] mb-1.5">
            5-Level Ads Matching Commission
          </h4>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] leading-relaxed">
            Every time any downline member watches daily ads, you instantly earn matching bonuses: <strong>L1: 25%</strong>, <strong>L2: 20%</strong>, <strong>L3: 15%</strong>, <strong>L4: 10%</strong>, and <strong>L5: 5%</strong> of their ad rewards.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#e89b27] mb-1.5">
            Unlimited Depth Team Milestones
          </h4>
          <p className="text-xs text-[#526d72] dark:text-[#94a3b8] leading-relaxed">
            Every ad watched across your entire lineage increments your <strong>Team Ads</strong> counter by +1, unlocking Team Milestone rewards up to $150,000.
          </p>
        </div>
      </div>

      {/* SHARE REFERRAL MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a1b22] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#e4ded2] dark:border-[#173740] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 p-2 text-[#798e92] hover:text-[#09353e] dark:hover:text-white hover:bg-[#f3eee5] dark:hover:bg-[#122b33] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#2dd4bf] flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#09353e] dark:text-white">Share Referral Link</h3>
                <p className="text-xs text-[#526d72] dark:text-[#94a3b8]">Earn 5-level matching commission on all ad views</p>
              </div>
            </div>

            {/* Referral Username Display */}
            <div className="bg-[#faf8f5] dark:bg-[#07151a] p-3.5 rounded-2xl border border-[#e2dcce] dark:border-[#173740] mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#798e92] dark:text-[#94a3b8] block">
                  Your Referral Code
                </span>
                <span className="text-base font-black font-mono text-[#0c5963] dark:text-[#2dd4bf]">
                  @{activeUsername}
                </span>
              </div>
              <button
                onClick={() => handleCopyLink(currentActiveLink, 'modal')}
                className="px-3 py-1.5 bg-[#09353e] dark:bg-[#0c262e] hover:bg-[#052127] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedId === 'modal' ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'modal' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Social Share Channels */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#798e92] dark:text-[#94a3b8] block">
                Choose Channel
              </span>
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
            <div className="mt-5 pt-4 border-t border-[#eee9df] dark:border-[#173740]">
              <button
                id="btn-modal-copy-link"
                onClick={() => handleCopyLink(currentActiveLink, 'modal_full')}
                className="w-full py-3 px-4 bg-[#0c5963] hover:bg-[#08424b] text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#0c5963]/20"
              >
                {copiedId === 'modal_full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'modal_full' ? 'Link Copied to Clipboard!' : 'Copy Full Invitation Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
