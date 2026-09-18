/**
 * TAEMRY FLUX - Official Protocol Whitepaper (v2.0)
 * Fully dynamic: loads live from backend /api/whitepaper
 * Editable by Admin via Admin Control Panel
 * Features: Guaranteed 20% Daily Return statement, 8-Tier Direct Referral Team Rewards,
 * 5-Level Commission structure, and Comprehensive FAQs.
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  Award,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Wallet,
  Phone,
  Mail,
  Send,
  Clock,
  ExternalLink,
  Gift,
  Pickaxe,
  Flame,
  Zap,
  TrendingUp,
  RotateCcw,
  Calendar
} from 'lucide-react';
import apiClient from '../api/client';
import Logo from '../components/Logo';

export default function WhitepaperPage({ onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSplash, setFaqSplash] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleToggleFaq = (e, index) => {
    setFaqSplash({
      id: Date.now() + Math.random(),
      index,
    });
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Default whitepaper content state
  const [data, setData] = useState({
    title: 'TAEMRY FLUX Official Protocol Whitepaper',
    subtitle: 'Decentralized Reward-Based Advertising, Cloud Hash Miner & TFLX Network',
    version: '2.5.0',
    lastUpdated: 'March 2026',
    executiveSummary: 'TAEMRY FLUX is a decentralized ecosystem uniting reward-based verified advertising, continuous 12-hour tap-to-mine Cloud Hash Mining, and TFLX Token network distribution. Members activate advertising allocation contracts to unlock guaranteed daily ad returns up to 20%, participate in 5-tier direct downline commissions and Team Rewards, and power their cloud mining engines with pre-staking yields and guild multipliers.',
    packagesNote: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.',
    teamRewards: [
      { id: 'tr-5', referrals: 5, bonus: 1.00, label: '5 Referrals', extraInfo: 'Invite 5 members from your link' },
      { id: 'tr-15', referrals: 15, bonus: 3.00, label: '15 Referrals', extraInfo: '15 more members = 20 total' },
      { id: 'tr-25', referrals: 25, bonus: 5.00, label: '25 Referrals', extraInfo: '25 more members = 45 total' },
      { id: 'tr-50', referrals: 50, bonus: 10.00, label: '50 Referrals', extraInfo: '50 more members = 95 total' },
      { id: 'tr-100', referrals: 100, bonus: 20.00, label: '100 Referrals', extraInfo: '100 more members = 195 total' },
      { id: 'tr-250', referrals: 250, bonus: 40.00, label: '250 Referrals', extraInfo: '250 more members = 445 total' },
      { id: 'tr-500', referrals: 500, bonus: 100.00, label: '500 Referrals', extraInfo: '500 more members = 945 total' },
      { id: 'tr-1000', referrals: 1000, bonus: 250.00, label: '1,000 Referrals', extraInfo: '1000 more members = 1945 total' },
      { id: 'tr-1500', referrals: 1500, bonus: 500.00, label: '1,500 Referrals', extraInfo: 'Reach 3445 total direct downlines' },
      { id: 'tr-2500', referrals: 2500, bonus: 750.00, label: '2,500 Referrals', extraInfo: 'Reach 5945 total direct downlines' },
    ],
    packages: [
      { name: 'Bronze', price: '$1.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'STARTER' },
      { name: 'Silver', price: '$5.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'POPULAR' },
      { name: 'Gold', price: '$10.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'RECOMMENDED' },
      { name: 'Premium', price: '$50.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'PRO' },
      { name: 'Elite', price: '$100.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'HIGH CAPACITY' },
      { name: 'Master', price: '$500.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'ENTERPRISE' },
      { name: 'Apex', price: '$1,000.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'GRAND MASTER' },
    ],
    faqs: [
      {
        q: 'Q1. What is TAEMRY FLUX?',
        a: 'It is a verified reward-based advertising and referral growth ecosystem. You earn US Dollars ($) by watching ads, inviting friends via your direct link to claim Team Rewards, and building an organization.'
      },
      {
        q: 'Q2. Do I have to pay to start earning?',
        a: 'Yes. You must activate a starter package (starting from $1) to unlock daily ad viewing. This prevents bot automation and guarantees legitimate user attention for our advertising partners.'
      },
      {
        q: 'Q3. What is the daily return rate on packages?',
        a: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.'
      },
      {
        q: 'Q4. How do Team Rewards work?',
        a: 'Team Rewards are direct referral cash bonuses credited straight to your balance when you invite members from your link: 5 referrals = $1, 15 referrals = $5, 40 referrals = $10, 90 referrals = $25, 190 referrals = $50, 250 referrals = $100, 500 referrals = $250, and 1,000 referrals = $600 ($500 + $100 Mega Bonus)!'
      },
      {
        q: 'Q5. How deep is the referral network for commissions?',
        a: 'Downline commissions are paid 5 Levels deep (L1: 20%, L2: 10%, L3: 5%, L4: 3%, L5: 2%) whenever direct downlines purchase advertising packages.'
      },
      {
        q: 'Q6. How are member withdrawals processed?',
        a: 'Withdrawals are processed directly to your preferred payment method (Bank, Easypaisa, JazzCash, or USDT/BTC) with a low $1.00 minimum threshold, reviewed within 1 to 24 hours.'
      },
      {
        q: 'Q7. What happens if I do not watch ads for a few days?',
        a: 'Your account remains active. Your accumulated wallet balance and earned referral rewards never expire. You can resume watching ads whenever you wish.'
      },
      {
        q: 'Q8. What deposit and withdrawal methods are supported?',
        a: '1. Local Bank Transfer, 2. Easypaisa / JazzCash (Pegged exchange rate: 1 USD = 300 PKR), 3. Cryptocurrency (USDT TRC20 / BEP20 and Bitcoin).'
      },
      {
        q: 'Q9. What are the minimum and maximum withdrawal thresholds?',
        a: 'Minimum withdrawal is $1.00 USD. Maximum withdrawal per single request is $1,000.00 USD.'
      },
      {
        q: 'Q10. Are there restrictions on withdrawal frequency?',
        a: 'Members may submit one withdrawal request per calendar day, processed within 1 to 5 hours after approval.'
      },
      {
        q: 'Q11. Is TAEMRY FLUX a get-rich-quick scheme?',
        a: 'No. TAEMRY FLUX distributes real corporate advertising revenue generated through high-engagement sponsor impressions.'
      },
      {
        q: 'Q12. What are the consequences of using VPNs or multiple accounts?',
        a: 'Strictly prohibited. Operating VPNs, proxy tunnels, headless automation bots, or multi-accounting results in immediate, irreversible suspension and forfeiture of balances.'
      },
      {
        q: 'Q13. What is the TAEMRY FLUX Cloud Miner and how does it work?',
        a: 'The TAEMRY FLUX Cloud Miner is a decentralized tap-to-mine hashrate engine operating on a 12-hour continuous cycle. Members activate a 12h session by tapping the miner core, generating TFLX tokens at a base speed of 16.0 TFLX/hour without consuming phone battery or device hardware.'
      },
      {
        q: 'Q14. What are the prerequisites to activate Cloud Mining?',
        a: 'An active advertising package contract (Bronze $1 to Apex $1,000) is required to unlock full Cloud Miner eligibility. Once a package is active, cloud mining and token accumulation run continuously.'
      },
      {
        q: 'Q15. How does Pre-Staking & Guild Boosting increase mining speed?',
        a: 'Members can lock future TFLX tokens (up to 5 years and 100% allocation) to unlock up to a +250% Pre-Staking hashrate boost. Additionally, active downline members in your 2-Tier Guild add extra hashrate: +4.0 TFLX/h per Tier 1 active miner and +0.8 TFLX/h per Tier 2 active miner.'
      },
      {
        q: 'Q16. What are Day-Offs and the Slashing mechanism in Cloud Mining?',
        a: 'If a member fails to re-tap the miner within the grace period after their 12-hour session concludes, inactivity slashing reduces unverified tokens. However, earned Day-Off shields automatically protect your streak and mined balance from penalties.'
      }
    ],
    supportContact: {
      email: 'support@taemryflux.com',
      whatsapp: '+92 300 0000000',
      telegram: '@TaemryFluxOfficial',
      hours: '24/7 Available (Response within 2-4 hours)',
    }
  });

  // Fetch live whitepaper from backend
  useEffect(() => {
    const fetchLiveWhitepaper = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/whitepaper');
        if (res.data?.success && res.data.whitepaper) {
          setData(res.data.whitepaper);
        }
      } catch (err) {
        console.warn('Using default whitepaper fallback:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveWhitepaper();
  }, []);

  const handleCopyAll = () => {
    const text = document.getElementById('whitepaper-content')?.innerText || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const teamMilestones = [
     { ads: 2500, bonus: 5.00, label: '2,500 Team Ads' },
  { ads: 5000, bonus: 10.00, label: '5,000 Team Ads' },
  { ads: 10000, bonus: 20.00, label: '10,000 Team Ads' },
  { ads: 20000, bonus: 40.00, label: '20,000 Team Ads' },
  { ads: 40000, bonus: 80.00, label: '40,000 Team Ads' },
  { ads: 80000, bonus: 160.00, label: '80,000 Team Ads' },
  { ads: 160000, bonus: 320.00, label: '160,000 Team Ads' },
  { ads: 320000, bonus: 640.00, label: '320,000 Team Ads' },
  { ads: 640000, bonus: 1280.00, label: '640,000 Team Ads' },
  { ads: 1280000, bonus: 2560.00, label: '1,280,000 Team Ads' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#07171d] text-[#1c2e33] dark:text-[#f0f4f6] font-sans antialiased transition-colors duration-200">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b1f26]/95 backdrop-blur-md border-b border-[#e4ded2] dark:border-[#173740] px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl bg-[#f0eae0] dark:bg-[#122b33] text-[#093e4a] dark:text-[#38bdf8] hover:bg-[#e6decf] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showText={false} />
              <div>
                <span className="text-sm font-black text-[#093e4a] dark:text-white tracking-wider uppercase block">
                  TAEMRY
                </span>
                <span className="text-[10px] font-bold text-[#0c5963] dark:text-[#38bdf8] uppercase tracking-widest block -mt-1">
                  Official Protocol Whitepaper
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 rounded-xl bg-[#f4eee4] dark:bg-[#122b33] hover:bg-[#eae1d3] text-[#093e4a] dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy entire document text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0c5963]" />}
              <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-[#f4eee4] dark:bg-[#122b33] hover:bg-[#eae1d3] text-[#093e4a] dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#0c5963]" />
              <span className="hidden md:inline">Print / PDF</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-1.5 rounded-xl bg-[#0c5963] hover:bg-[#08424a] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Document Header Card */}
        <div className="bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-10 border border-[#e4ded2] dark:border-[#173740] shadow-sm mb-8 text-center sm:text-left relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#0c5963]/5 dark:bg-[#38bdf8]/5 pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f4f1] dark:bg-[#0d2a33] text-[#0c5963] dark:text-[#38bdf8] text-xs font-black uppercase tracking-widest border border-[#bce3dc] dark:border-[#173d47]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Protocol Document</span>
            </div>

            <div className="text-xs text-[#6b7280] dark:text-[#94a3b8] font-mono">
              Version: <strong className="text-[#093e4a] dark:text-white">{data.version}</strong> • Updated: {data.lastUpdated}
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#093e4a] dark:text-white tracking-tight leading-tight mb-2">
            {data.title}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#5a7277] dark:text-[#cbd5e1] max-w-3xl">
            {data.subtitle}
          </p>

          {/* Quick Table of Contents Jump Links */}
          <div className="mt-6 pt-6 border-t border-[#ece5d8] dark:border-[#173740] flex flex-wrap gap-2 text-xs">
            {[
              { label: '1. Welcome', id: 'sec-welcome' },
              { label: '2. Getting Started', id: 'sec-get-started' },
              { label: '3. Packages & 20% Returns', id: 'sec-packages' },
              { label: '4. Cloud Miner & TFLX', id: 'sec-cloud-miner' },
              { label: '5. Team Rewards Ladder', id: 'sec-team-rewards' },
              { label: '6. 5-Level Commissions', id: 'sec-commissions' },
              { label: '7. Withdrawal Policy', id: 'sec-withdrawal-rules' },
              { label: '8. Payment Channels', id: 'sec-methods' },
              { label: '9. FAQs & Rules', id: 'sec-faqs' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-3 py-1 rounded-lg bg-[#faf8f5] dark:bg-[#122b33] hover:bg-[#0c5963] hover:text-white dark:hover:bg-[#38bdf8] dark:hover:text-[#0c2027] text-[#5a7277] dark:text-[#94a3b8] border border-[#e4ded2] dark:border-[#1e4450] font-bold transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body Container */}
        <div id="whitepaper-content" className="bg-white dark:bg-[#0c2027] rounded-3xl p-6 sm:p-10 border border-[#e4ded2] dark:border-[#173740] shadow-sm space-y-12">
          
          {/* SECTION 1: WELCOME & EXECUTIVE SUMMARY */}
          <section id="sec-welcome" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">1</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                WELCOME & EXECUTIVE PROTOCOL SUMMARY
              </h2>
            </div>
            <div className="pl-9 space-y-3 text-sm leading-relaxed text-[#374151] dark:text-[#cbd5e1]">
              <p>
                {data.executiveSummary}
              </p>
              <div className="p-4 rounded-2xl bg-[#0c5963]/5 dark:bg-[#0c2e38] border border-[#0c5963]/20 dark:border-[#174653] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#093e4a] dark:text-[#e2e8f0]">
                  Protocol Architecture & Community Stewardship:
                </span>
                <span className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] px-3 py-1 rounded-lg bg-white dark:bg-[#091f26] border border-[#0c5963]/30">
                  Founder & Director: Taimur Khan'X
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: HOW TO GET STARTED */}
          <section id="sec-get-started" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">2</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                HOW TO GET STARTED (3 Steps)
              </h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                  <div className="w-7 h-7 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">1</div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Step 1: Sign Up</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] mt-1">Register using your email or Google Account to establish your member wallet.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                  <div className="w-7 h-7 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">2</div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Step 2: Deposit Funds</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] mt-1">Deposit funds via Easypaisa, JazzCash, Bank Transfer, or Crypto ($1 - $1,000 USD).</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                  <div className="w-7 h-7 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">3</div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Step 3: Buy a Package</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] mt-1">Select your allocation package to instantly unlock daily ads and live 20% daily returns.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Package Prerequisite:</strong> An active package is mandatory to unlock ad view earnings. This ensures human verification and prevents automated scraping bots.
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 3: THE 7 PACKAGES & GUARANTEED 20% DAILY RETURN */}
          <section id="sec-packages" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">3</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                THE 7 PACKAGES & GUARANTEED 20% DAILY RETURN
              </h2>
            </div>
            
            <div className="pl-9 space-y-4">
              {/* Highlighted Guaranteed Return Callout */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm font-semibold leading-relaxed flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-800 dark:text-emerald-300 font-black mb-0.5">
                    GUARANTEED DAILY RETURN MANDATE
                  </strong>
                  {data.packagesNote}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#e5ded0] dark:border-[#173e49]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f0e6] dark:bg-[#0f2831] text-[#093e4a] dark:text-white font-bold text-xs uppercase tracking-wider border-b border-[#e5ded0] dark:border-[#173e49]">
                    <tr>
                      <th className="py-3 px-4">Package</th>
                      <th className="py-3 px-4">Price (USD)</th>
                      <th className="py-3 px-4">Daily Quota</th>
                      <th className="py-3 px-4">Guaranteed Return</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece5d8] dark:divide-[#173e49] text-[#374151] dark:text-[#cbd5e1]">
                    {data.packages?.map((pkg) => (
                      <tr key={pkg.name} className="hover:bg-[#fbf9f6] dark:hover:bg-[#122e38] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#093e4a] dark:text-white">{pkg.name}</td>
                        <td className="py-3 px-4 font-black text-[#0c5963] dark:text-[#38bdf8]">{pkg.price}</td>
                        <td className="py-3 px-4 text-xs font-semibold">{pkg.dailyLimit}</td>
                        <td className="py-3 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {pkg.dailyReturn || '20% Daily Return'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-[#eef2f5] dark:bg-[#15343e] text-[#334155] dark:text-[#94a3b8]">
                            {pkg.badge}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SECTION 4: CLOUD HASH MINER & TFLX NETWORK */}
          <section id="sec-cloud-miner" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-r from-[#d97706] to-[#ea580c] text-white font-bold text-xs shadow-xs">
                4
              </span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white flex items-center gap-2">
                <span>TAEMRY CLOUD HASH MINER &amp; TFLX NETWORK</span>
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-[#d97706] border border-amber-500/30">
                  Tap-to-Mine
                </span>
              </h2>
            </div>

            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <p className="leading-relaxed">
                The <strong>TAEMRY FLUX Cloud Miner</strong> is a decentralized, server-authoritative hashrate engine engineered to distribute native <strong>TFLX Tokens</strong> to active community members. Unlike resource-heavy proof-of-work mining, the cloud miner operates purely on cloud servers without draining mobile battery or hardware resources.
              </p>

              {/* Core Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#d97706] dark:text-[#f59e0b] font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>12-Hour Mining Cycles</span>
                  </div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Tap-to-Mine Architecture</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Each mining session runs for 12 continuous hours with an active status countdown. Once a cycle completes, a single tap reactivates cloud hashrate.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>16.0 TFLX/h Base Rate</span>
                  </div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Verified Yield Stream</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Base yield starts at 16.0 TFLX per hour (192 TFLX/day). Active advertising package contracts are required to activate and maintain mining eligibility.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" />
                    <span>Up to +250% Boost</span>
                  </div>
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">Pre-Staking Multiplier</div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Commit up to 100% token allocation and 1 to 5 years duration to multiply your daily mining speed by up to an additional +250%.
                  </p>
                </div>
              </div>

              {/* Advanced Mechanics: Guilds, Protection & Check-Ins */}
              <div className="p-4 rounded-2xl bg-[#fffbeb]/80 dark:bg-[#18130a] border border-[#fde68a] dark:border-[#382613] space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#92400e] dark:text-[#f59e0b] flex items-center gap-1.5">
                  <Pickaxe className="w-4 h-4 text-[#d97706]" />
                  <span>Cloud Miner Specifications &amp; Operational Policies</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#78350f] dark:text-[#fde68a]">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0a1b22] border border-[#fde68a]/70 dark:border-[#422d10]">
                    <strong className="block text-[#92400e] dark:text-[#f59e0b] font-black mb-1">
                      1. Two-Tier Guild Mining Boost
                    </strong>
                    Invite teammates to build a 2-Tier Mining Guild. Each active Tier 1 miner adds <strong>+4.0 TFLX/h</strong>, and each active Tier 2 miner adds <strong>+0.8 TFLX/h</strong> to your live hashrate.
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0a1b22] border border-[#fde68a]/70 dark:border-[#422d10]">
                    <strong className="block text-[#92400e] dark:text-[#f59e0b] font-black mb-1">
                      2. Slashing &amp; Day-Off Protection
                    </strong>
                    Inactivity after a completed 12h session incurs gradual coin slashing. However, daily streak check-ins award <strong>Day-Off Shields</strong> that automatically prevent penalties during offline days.
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0a1b22] border border-[#fde68a]/70 dark:border-[#422d10]">
                    <strong className="block text-[#92400e] dark:text-[#f59e0b] font-black mb-1">
                      3. 7-Day Consecutive Check-In
                    </strong>
                    Maintain consecutive daily check-ins to claim bonus TFLX tokens (Day 1: +2 TFLX up to Day 7: +25 TFLX + extra Day-Off Shield).
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0a1b22] border border-[#fde68a]/70 dark:border-[#422d10]">
                    <strong className="block text-[#92400e] dark:text-[#f59e0b] font-black mb-1">
                      4. Halving Epochs &amp; Token Scarcity
                    </strong>
                    To safeguard token economics, hashrate undergoes scheduled halving epochs as total community milestones are reached, ensuring sustainable long-term value.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: TEAM REWARDS LADDER */}
          <section id="sec-team-rewards" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">5</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                TEAM REWARDS LADDER (DIRECT REFERRAL CASH BONUSES)
              </h2>
            </div>

            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
                Every time you invite new members with your personal referral link, your direct referral counter increases. As you hit each milestone threshold below, an instant cash reward is unlocked and credited straight to your balance:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-[#e2d9cb] dark:border-[#173e49]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0eae0] dark:bg-[#0f2831] text-[#093e4a] dark:text-white font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Direct Referrals Required</th>
                      <th className="py-3 px-4">Cash Reward ($ USD)</th>
                      <th className="py-3 px-4">Requirement Details</th>
                      <th className="py-3 px-4">Claim Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece5d8] dark:divide-[#173e49]">
                    {data.teamRewards?.map((tier, idx) => (
                      <tr key={idx} className="hover:bg-[#fbf9f6] dark:hover:bg-[#122e38] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
                          Tier {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-black text-sm text-[#093e4a] dark:text-white">
                          {tier.referrals} Direct Members
                        </td>
                        <td className="py-3 px-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                          +${Number(tier.bonus).toFixed(2)} USD
                        </td>
                        <td className="py-3 px-4 text-xs text-[#52666a] dark:text-[#94a3b8]">
                          {tier.note || tier.stepNote || `Reach ${tier.referrals} referrals`}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Instant Wallet Credit
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Team Ad Views Milestone Note */}
              <div className="mt-4 p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#093e4a] dark:text-white mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                  <span>Team Ad Milestones (Unlimited Network Depth Level 1 to 100+)</span>
                </h4>
                <p className="text-xs text-[#52666a] dark:text-[#94a3b8] mb-3">
                  In addition to direct cash rewards, all ad views across your entire team tree accumulate toward unlimited-depth Team Milestones ($1 to $4,096 bonuses).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {teamMilestones.slice(0, 8).map((m) => (
                    <div key={m.ads} className="p-2 rounded-xl bg-white dark:bg-[#122e38] border border-[#e4ded2] dark:border-[#1e4854]">
                      <span className="text-[10px] text-[#718286] dark:text-[#94a3b8] block">{m.ads} Team Ads</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{m.bonus} USD</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: 5-LEVEL COMMISSIONS */}
          <section id="sec-commissions" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">6</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                5-LEVEL DOWNLINE & ADS MATCHING COMMISSIONS
              </h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] uppercase tracking-wider">
                  A) Daily Ads Matching Commission (Earned per ad viewed by downline)
                </h3>
                <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
                  Whenever downline members in your 5-tier team watch their daily ads quota, you instantly receive matching commissions credited to your wallet balance:
                </p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { lvl: 'Level 1', pct: '25%', label: 'Direct' },
                    { lvl: 'Level 2', pct: '20%', label: 'Tier 2' },
                    { lvl: 'Level 3', pct: '15%', label: 'Tier 3' },
                    { lvl: 'Level 4', pct: '10%', label: 'Tier 4' },
                    { lvl: 'Level 5', pct: '5%', label: 'Tier 5' },
                  ].map((item) => (
                    <div key={item.lvl} className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                      <span className="text-[10px] font-bold text-[#718286] dark:text-[#94a3b8] block">{item.lvl}</span>
                      <strong className="text-base font-black text-emerald-600 dark:text-emerald-400 block my-0.5">{item.pct}</strong>
                      <span className="text-[10px] text-[#52666a] dark:text-[#94a3b8]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#ece5d8] dark:border-[#173740]">
                <h3 className="text-xs font-bold text-[#0c5963] dark:text-[#38bdf8] uppercase tracking-wider">
                  B) Package Activation Referral Commission
                </h3>
                <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
                  Whenever members in your network activate or upgrade an advertising package, direct downline commissions are distributed across 5 tiers:
                </p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { lvl: 'Level 1', pct: '20%', label: 'Direct' },
                    { lvl: 'Level 2', pct: '10%', label: 'Tier 2' },
                    { lvl: 'Level 3', pct: '5%', label: 'Tier 3' },
                    { lvl: 'Level 4', pct: '3%', label: 'Tier 4' },
                    { lvl: 'Level 5', pct: '2%', label: 'Tier 5' },
                  ].map((item) => (
                    <div key={item.lvl} className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49]">
                      <span className="text-[10px] font-bold text-[#718286] dark:text-[#94a3b8] block">{item.lvl}</span>
                      <strong className="text-base font-black text-[#0c5963] dark:text-[#38bdf8] block my-0.5">{item.pct}</strong>
                      <span className="text-[10px] text-[#52666a] dark:text-[#94a3b8]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: WITHDRAWAL RULES */}
          <section id="sec-withdrawal-rules" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">7</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                WITHDRAWAL RULES & ELIGIBILITY POLICY
              </h2>
            </div>
            <div className="pl-9 space-y-3 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="space-y-2">
                {[
                  { title: '1. Minimum Withdrawal', desc: '$1.00 USD threshold for easy accessibility.' },
                  { title: '2. Permanent Referral Eligibility', desc: '1 active referral is required to unlock your withdrawal gateway. Once referred, your account is permanently eligible forever.' },
                  { title: '3. Maximum Withdrawal', desc: '$1,000.00 USD per single request.' },
                  { title: '4. Fast Processing Time', desc: 'Withdrawals are audited and transferred within 1 to 5 hours.' },
                  { title: '5. Anti-VPN & Integrity Policy', desc: 'Operating proxies, VPN tunnels, or headless automation bots is strictly prohibited and results in immediate forfeiture.' },
                ].map((rule) => (
                  <div key={rule.title} className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#093e4a] dark:text-white text-xs">{rule.title}: </span>
                      <span className="text-xs text-[#4b5563] dark:text-[#cbd5e1]">{rule.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 8: PAYMENT CHANNELS & EXCHANGE RATE */}
          <section id="sec-methods" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">8</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                DEPOSIT & WITHDRAWAL PAYMENT CHANNELS
              </h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#093e4a] dark:text-white text-sm">
                      A) LOCAL WALLETS (JazzCash / UPaisa / SadaPay)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-[#0c5963] text-white text-xs font-black">
                    Pegged Exchange Rate: 1 USD = 300 PKR
                  </div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Deposit PKR directly to our verified Official Receiver accounts and submit your Transaction ID (TID) and receipt proof. Deposits are confirmed in ~1 minute. Withdrawals are processed directly to your Account Number or IBAN within 1 to 5 hours.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#093e4a] dark:text-white text-sm">
                      B) BANK TRANSFER & CRYPTO (USDT)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">NOT AVAILABLE FOR NOW</span>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-[#718286] text-white text-xs font-black">
                    Scheduled Infrastructure Upgrades
                  </div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Direct commercial Bank Transfer and on-chain USDT/Crypto channels are currently undergoing scheduled network maintenance. Please utilize our active JazzCash, UPaisa, or SadaPay gateways for instant transactions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: FREQUENTLY ASKED QUESTIONS (ADMIN EDITABLE) */}
          <section id="sec-faqs" className="scroll-mt-24 pt-8 border-t border-[#ece5d8] dark:border-[#173740]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0c5963]/10 dark:bg-[#38bdf8]/10 text-[#0c5963] dark:text-[#38bdf8] mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl font-extrabold text-[#093e4a] dark:text-white">
                Everything You Need to Know (FAQs)
              </h2>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1">
                Official answers to questions regarding packages, returns, Team Rewards, and withdrawals.
              </p>
            </div>

            <div className="space-y-3">
              {data.faqs?.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#e5ded0] dark:border-[#173e49] bg-[#faf8f5] dark:bg-[#0f2831] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleFaq(e, index)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-sm text-[#093e4a] dark:text-white hover:bg-[#f5efe4] dark:hover:bg-[#13303a] transition-colors cursor-pointer select-none group"
                    >
                      <span className="flex-1">{faq.q}</span>
                      <div className="relative shrink-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.06 : 1 }}
                          whileTap={{ scale: 0.88 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-colors ${
                            isOpen
                              ? 'bg-[#0c5963] text-white shadow-xs'
                              : 'bg-[#ece5d8] dark:bg-[#143742] text-[#0c5963] dark:text-[#38bdf8] group-hover:bg-[#ded5c6] dark:group-hover:bg-[#1b434f]'
                          }`}
                        >
                          {/* Fluid circular splash ripple wave */}
                          <AnimatePresence>
                            {faqSplash && faqSplash.index === index && (
                              <motion.span
                                key={faqSplash.id}
                                initial={{ scale: 0, opacity: 0.9, filter: 'blur(0px)' }}
                                animate={{ scale: 4.5, opacity: 0, filter: 'blur(10px)' }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="pointer-events-none absolute inset-0 m-auto rounded-full w-8 h-8 bg-gradient-to-r from-[#0c5963] to-[#10b981]"
                              />
                            )}
                          </AnimatePresence>

                          <ChevronDown className="w-4 h-4 relative z-10 flex-shrink-0" />
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
                          <div className="p-4 pt-0 text-xs sm:text-sm text-[#4b5563] dark:text-[#cbd5e1] leading-relaxed border-t border-[#efe9dd] dark:border-[#173e49] bg-white dark:bg-[#0c2027] whitespace-pre-line">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 9: SUPPORT DESK CONTACT CHANNELS */}
          {data.supportContact && (
            <section className="p-6 rounded-3xl bg-[#f5f0e6] dark:bg-[#0f2831] border border-[#e4ded2] dark:border-[#173e49] space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#0c5963] dark:text-[#38bdf8]" />
                <h3 className="text-base font-bold text-[#093e4a] dark:text-white">
                  Official Support Desk & Community Assistance
                </h3>
              </div>
              <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
                Need help with deposits, account verification, or Team Rewards? Contact our official customer care channels:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-semibold">
                <div className="p-3 rounded-xl bg-white dark:bg-[#122e38] border border-[#e4ded2] dark:border-[#1e4854] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8]" />
                  <div>
                    <span className="text-[10px] text-[#718286] block">Email Support:</span>
                    <span className="text-[#093e4a] dark:text-white font-mono">{data.supportContact.email}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#122e38] border border-[#e4ded2] dark:border-[#1e4854] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-[#718286] block">WhatsApp Helpline:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">{data.supportContact.whatsapp}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#122e38] border border-[#e4ded2] dark:border-[#1e4854] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[10px] text-[#718286] block">Operating Hours:</span>
                    <span className="text-[#093e4a] dark:text-white">{data.supportContact.hours}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Document Footer Signature */}
          <div className="mt-8 pt-6 border-t border-[#ece5d8] dark:border-[#173740] text-center text-xs text-[#718286] dark:text-[#94a3b8]">
            <p className="font-bold text-[#093e4a] dark:text-white">© 2026 TAEMRY FLUX PROTOCOL. All rights reserved.</p>
            <p className="mt-1">Founder & Executive Director: <strong>Taimur Khan'X</strong></p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Published & Maintained by TAEMRY FLUX Network Administration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
