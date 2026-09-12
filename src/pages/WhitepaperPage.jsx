/**
 * TAEMRY FLUX - Official Protocol Whitepaper (v2.0)
 * Fully dynamic: loads live from backend /api/whitepaper
 * Editable by Admin via Admin Control Panel
 * Features: Guaranteed 20% Daily Return statement, 8-Tier Direct Referral Team Rewards,
 * 5-Level Commission structure, and Comprehensive FAQs.
 */

import React, { useState, useEffect } from 'react';
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
  Gift
} from 'lucide-react';
import apiClient from '../api/client';
import Logo from '../components/Logo';

export default function WhitepaperPage({ onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default whitepaper content state
  const [data, setData] = useState({
    title: 'TAEMRY FLUX Official Protocol Whitepaper',
    subtitle: 'Decentralized Reward-Based Advertising & Team Distribution Network',
    version: '2.0.0',
    lastUpdated: 'March 2025',
    executiveSummary: 'TAEMRY FLUX is a decentralized, reward-based advertising and referral growth ecosystem. Members activate advertising allocation contracts from their wallet balances, unlock consecutive daily ad streams delivering up to 20% daily returns, and participate in a 5-tier direct downline commission structure alongside direct referral Team Rewards.',
    packagesNote: 'Every package delivers a guaranteed 20% daily return rate through our daily ads quota. Once your package is activated from your wallet balance, your daily ads unlock immediately, and your daily returns are credited directly to your live balance.',
    teamRewards: [
      { referrals: 5, bonus: 1.00, label: '5 Referrals', note: 'Invite 5 members from your direct link' },
      { referrals: 15, bonus: 5.00, label: '15 Referrals', note: '10 more members (+10) = 15 total' },
      { referrals: 40, bonus: 10.00, label: '40 Referrals', note: '25 more members (+25) = 40 total' },
      { referrals: 90, bonus: 25.00, label: '90 Referrals', note: '50 more members (+50) = 90 total' },
      { referrals: 190, bonus: 50.00, label: '190 Referrals', note: '100 more members (+100) = 190 total' },
      { referrals: 250, bonus: 100.00, label: '250 Referrals', note: 'Reach 250 total direct downlines' },
      { referrals: 500, bonus: 250.00, label: '500 Referrals', note: 'Reach 500 total direct downlines' },
      { referrals: 1000, bonus: 600.00, label: '1,000 Referrals', note: '$500 Base + $100 Special Mega Bonus ($600 Total)' },
    ],
    packages: [
      { name: 'Bronze', price: '$1.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'STARTER' },
      { name: 'Silver', price: '$5.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'POPULAR' },
      { name: 'Gold', price: '$10.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'RECOMMENDED' },
      { name: 'Premium', price: '$50.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'PRO' },
      { name: 'Elite', price: '$100.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'HIGH CAPACITY' },
      { name: 'Master', price: '$500.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'ENTERPRISE' },
      { name: 'Apex', price: '$1,000.00', dailyLimit: '20% Daily Yield', dailyReturn: '20% Daily Return', badge: 'ELITE MASTER' },
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
        a: 'Members may submit one withdrawal request per calendar day, processed within 1 to 24 hours after admin approval.'
      },
      {
        q: 'Q11. Is TAEMRY FLUX a get-rich-quick scheme?',
        a: 'No. TAEMRY FLUX distributes real corporate advertising revenue generated through high-engagement sponsor impressions.'
      },
      {
        q: 'Q12. What are the consequences of using VPNs or multiple accounts?',
        a: 'Strictly prohibited. Operating VPNs, proxy tunnels, headless automation bots, or multi-accounting results in immediate, irreversible suspension and forfeiture of balances.'
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
    { ads: '2,500', bonus: '$1' },
    { ads: '5,000', bonus: '$2' },
    { ads: '10,000', bonus: '$4' },
    { ads: '20,000', bonus: '$8' },
    { ads: '40,000', bonus: '$16' },
    { ads: '80,000', bonus: '$32' },
    { ads: '160,000', bonus: '$64' },
    { ads: '320,000', bonus: '$128' },
    { ads: '640,000', bonus: '$256' },
    { ads: '1,280,000', bonus: '$512' },
    { ads: '2,560,000', bonus: '$1,024' },
    { ads: '5,120,000', bonus: '$2,048' },
    { ads: '10,240,000', bonus: '$4,096' },
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
              { label: '4. Team Rewards Ladder', id: 'sec-team-rewards' },
              { label: '5. 5-Level Commissions', id: 'sec-commissions' },
              { label: '6. Withdrawal Policy', id: 'sec-withdrawal-rules' },
              { label: '7. Payment Channels', id: 'sec-methods' },
              { label: '8. FAQs & Rules', id: 'sec-faqs' },
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

          {/* SECTION 4: TEAM REWARDS LADDER (REPLACES PERSONAL ADS) */}
          <section id="sec-team-rewards" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">4</span>
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

          {/* SECTION 5: 5-LEVEL COMMISSIONS */}
          <section id="sec-commissions" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">5</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                5-LEVEL DOWNLINE PACKAGE COMMISSIONS
              </h2>
            </div>
            <div className="pl-9 space-y-3 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
                Whenever downline members in your organizational hierarchy purchase or upgrade packages, commissions are distributed automatically across 5 tiers:
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
          </section>

          {/* SECTION 6: WITHDRAWAL RULES */}
          <section id="sec-withdrawal-rules" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">6</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                WITHDRAWAL RULES & COMPLIANCE
              </h2>
            </div>
            <div className="pl-9 space-y-3 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="space-y-2">
                {[
                  { title: '1. Minimum Withdrawal', desc: '$1.00 USD' },
                  { title: '2. Maximum Withdrawal', desc: '$1,000.00 USD (per single request)' },
                  { title: '3. Daily Request Frequency', desc: '1 withdrawal request per calendar day' },
                  { title: '4. Anti-VPN & Multi-Account Policy', desc: 'VPNs, proxies, and emulator automation are strictly forbidden.' },
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

          {/* SECTION 7: PAYMENT CHANNELS & EXCHANGE RATE */}
          <section id="sec-methods" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#0c5963] text-white font-bold text-xs">7</span>
              <h2 className="text-xl font-bold text-[#093e4a] dark:text-white">
                DEPOSIT & WITHDRAWAL PAYMENT CHANNELS
              </h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151] dark:text-[#cbd5e1]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-2">
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">
                    A) LOCAL CURRENCY (Bank / Easypaisa / JazzCash)
                  </div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-[#0c5963] text-white text-xs font-black">
                    Pegged Exchange Rate: 1 USD = 300 PKR
                  </div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Deposit PKR directly to our verified company accounts and upload your transaction receipt. Withdrawals are processed back to your mobile wallet or IBAN within 1 to 24 hours.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#0f2831] border border-[#e8e0d3] dark:border-[#173e49] space-y-2">
                  <div className="font-bold text-[#093e4a] dark:text-white text-sm">
                    B) CRYPTOCURRENCY CHANNELS (USDT & BTC)
                  </div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black">
                    Global Borderless Settlement
                  </div>
                  <p className="text-xs text-[#52666a] dark:text-[#94a3b8] leading-relaxed">
                    Supports USDT (TRC-20 / BEP-20) and Bitcoin (BTC). Instant on-chain tracking for deposits and direct wallet payouts worldwide.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: FREQUENTLY ASKED QUESTIONS (ADMIN EDITABLE) */}
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
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-sm text-[#093e4a] dark:text-white hover:bg-[#f5efe4] dark:hover:bg-[#13303a] transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#0c5963] dark:text-[#38bdf8] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#718286] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs sm:text-sm text-[#4b5563] dark:text-[#cbd5e1] leading-relaxed border-t border-[#efe9dd] dark:border-[#173e49] bg-white dark:bg-[#0c2027] whitespace-pre-line">
                        {faq.a}
                      </div>
                    )}
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
