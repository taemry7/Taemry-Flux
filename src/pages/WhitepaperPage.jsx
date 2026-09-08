import React, { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import Logo from '../components/Logo';

export default function WhitepaperPage({ onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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

  const personalMilestones = [
    { ads: '1,000', bonus: '$5' },
    { ads: '2,000', bonus: '$10' },
    { ads: '3,000', bonus: '$15' },
    { ads: '4,000', bonus: '$20' },
    { ads: '5,000', bonus: '$25' },
    { ads: '10,000', bonus: '$50' },
    { ads: '20,000', bonus: '$100' },
    { ads: '30,000', bonus: '$150' },
    { ads: '40,000', bonus: '$200' },
    { ads: '50,000', bonus: '$250' },
    { ads: '100,000', bonus: '$500' },
    { ads: '200,000', bonus: '$1,000' },
    { ads: '300,000', bonus: '$1,500' },
    { ads: '400,000', bonus: '$2,000' },
    { ads: '500,000', bonus: '$2,500' },
  ];

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

  const packages = [
    { name: 'Bronze', price: '$1', dailyLimit: '20 ads/day', reward: '0.1% per ad', badge: 'STARTER' },
    { name: 'Silver', price: '$5', dailyLimit: '40 ads/day', reward: '0.1% per ad', badge: 'POPULAR' },
    { name: 'Gold', price: '$10', dailyLimit: '60 ads/day', reward: '0.1% per ad', badge: 'RECOMMENDED' },
    { name: 'Premium', price: '$50', dailyLimit: '80 ads/day', reward: '0.1% per ad', badge: 'PRO' },
    { name: 'Elite', price: '$100', dailyLimit: '100 ads/day', reward: '0.1% per ad', badge: 'HIGH CAPACITY' },
    { name: 'Master', price: '$500', dailyLimit: '150 ads/day', reward: '0.1% per ad', badge: 'ELITE' },
    { name: 'Apex', price: '$1,000', dailyLimit: '200 ads/day', reward: '0.1% per ad', badge: 'ELITE MASTER' },
  ];

  const faqs = [
    {
      q: 'Q1. What is TAEMRY FLUX?',
      a: 'It is a reward-based advertising platform. You earn US Dollars ($) by watching ads, referring friends, and achieving milestones.'
    },
    {
      q: 'Q2. Do I have to pay to start earning?',
      a: 'Yes. You must buy a starter package (starting from $1) to become eligible. This prevents bots and ensures serious users.'
    },
    {
      q: 'Q3. Why can\'t I withdraw money if I have 0 referrals?',
      a: 'To build a strong community, you must invite at least 1 active friend (direct referral) before you can withdraw any amount.'
    },
    {
      q: 'Q4. How many levels deep is the referral network?',
      a: 'For Commissions: 5 Levels deep (L1 to L5: 20%, 10%, 5%, 3%, 2%). For Team Milestones: NO depth limit (Level 1 to 100 all count!).'
    },
    {
      q: 'Q5. What happens if I don\'t watch ads for a few days?',
      a: 'Your account stays active. Your lifetime ad counter never resets. You can start again anytime.'
    },
    {
      q: 'Q6. How do I claim my Milestone Bonuses?',
      a: 'Go to your Dashboard. Click the Green "Claim" button next to the achieved milestone. The bonus is instantly added to your wallet balance.'
    },
    {
      q: 'Q7. Can I claim the same milestone twice?',
      a: 'No. Each milestone is claimable ONLY ONCE. The system tracks your claimed history automatically.'
    },
    {
      q: 'Q8. What are the deposit and withdrawal methods?',
      a: '1. Local Bank Transfer, 2. Easypaisa / JazzCash (Fixed exchange rate: 1 USD = 300 PKR), 3. Crypto (USDT / BTC).'
    },
    {
      q: 'Q9. What is the minimum and maximum withdrawal?',
      a: 'Minimum: $1.00 USD. Maximum: $1,000.00 USD (per single request).'
    },
    {
      q: 'Q10. Are there any limits on withdrawals?',
      a: 'Yes: You can withdraw only ONCE per day, and you must wait at least 5 minutes between requests.'
    },
    {
      q: 'Q11. Is TAEMRY FLUX a scam or an investment scheme?',
      a: 'Absolutely NOT. It is a legitimate reward-based advertising platform, NOT a "get-rich-quick" scheme. Earnings come from real advertising revenue shared with users.'
    },
    {
      q: 'Q12. What happens if I use a VPN or create multiple accounts?',
      a: 'Strict action will be taken. Using VPNs, proxies, bots, or creating multiple accounts to cheat will result in a permanent ban and forfeiture of all funds.'
    },
    {
      q: 'Q13. What is the difference between Personal and Team Milestones?',
      a: '- Personal: Counts ONLY the ads YOU watch.\n- Team: Counts the TOTAL ads watched by YOU + YOUR ENTIRE DOWNLINE (Level 1 to 100 combined).'
    },
    {
      q: 'Q14. How do I get my referral link?',
      a: 'Log in to your dashboard. Go to the "Referrals" or "Team" section. Your unique referral link and code will be displayed there to share with friends.'
    },
    {
      q: 'Q15. Who do I contact if I face an issue?',
      a: 'Contact admin directly through the Support section on the website. Our team resolves queries within 24 hours.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[#e7e1d5]">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0c5963] hover:text-[#093e4a] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#dcd4c5] text-[#334b4f] hover:bg-[#f3eee5] transition-colors cursor-pointer shadow-xs"
              title="Copy full whitepaper text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#52666a]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0c5963] text-white hover:bg-[#093e4a] transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Document Container */}
        <div
          id="whitepaper-content"
          className="bg-white rounded-2xl border border-[#e5ded0] shadow-sm p-6 sm:p-10 text-[#1f2937]"
        >
          {/* Header Banner */}
          <div className="text-center pb-8 border-b border-[#ece5d8]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0c5963]/10 text-[#0c5963] mb-4">
              <FileText className="w-3.5 h-3.5" />
              Official Documentation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#093e4a] tracking-tight">
              TAEMRY FLUX
            </h1>
            <p className="text-lg font-medium text-[#4b5563] mt-2">
              Official User Whitepaper & Earnings Guide
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#6b7280]">
              <span className="px-2.5 py-0.5 rounded-md bg-[#f3efe8] text-[#374151]">Version 1.0</span>
              <span>•</span>
              <span>September 2026</span>
              <span>•</span>
              <span className="text-[#0c5963] font-bold">Founder: Taimur Khan'X</span>
            </div>
          </div>

          {/* Table of Contents Pill Bar */}
          <div className="my-8 p-4 rounded-xl bg-[#faf7f2] border border-[#ebe3d5]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-3">
              Table of Contents
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'sec-welcome', title: '1. Welcome' },
                { id: 'sec-get-started', title: '2. Get Started' },
                { id: 'sec-packages', title: '3. The 7 Packages' },
                { id: 'sec-how-to-earn', title: '4. 4 Income Streams' },
                { id: 'sec-withdrawal-rules', title: '5. Withdrawal Rules' },
                { id: 'sec-methods', title: '6. Payment Methods' },
                { id: 'sec-claim-milestones', title: '7. Claim Milestones' },
                { id: 'sec-fair-play', title: '8. Fair Play' },
                { id: 'sec-disclaimer', title: '9. Disclaimer' },
                { id: 'sec-faqs', title: '10. FAQs (15 Qs)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-2.5 py-1 rounded-md bg-white border border-[#e2d9cb] text-[#2c3e50] hover:bg-[#0c5963] hover:text-white hover:border-[#0c5963] transition-all cursor-pointer font-medium"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: WELCOME */}
          <section id="sec-welcome" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">1</span>
              <h2 className="text-xl font-bold text-[#093e4a]">WELCOME TO TAEMRY FLUX</h2>
            </div>
            <div className="pl-9 space-y-3 text-sm leading-relaxed text-[#374151]">
              <p>
                <strong>TAEMRY FLUX</strong> is a revolutionary reward-based advertising platform.
                We share advertising revenue with <strong>YOU</strong>. By watching ads, referring friends,
                and completing milestones, you earn real US Dollars ($) that you can withdraw to your bank,
                Easypaisa, JazzCash, or Crypto wallet.
              </p>
              <div className="p-3.5 rounded-xl bg-[#0c5963]/5 border border-[#0c5963]/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#093e4a]">
                  Platform Visionary & Architecture:
                </span>
                <span className="text-xs font-bold text-[#0c5963] px-2.5 py-1 rounded-md bg-white border border-[#0c5963]/30">
                  Founded by: Taimur Khan'X
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: HOW TO GET STARTED */}
          <section id="sec-get-started" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">2</span>
              <h2 className="text-xl font-bold text-[#093e4a]">HOW TO GET STARTED (3 Easy Steps)</h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                  <div className="w-6 h-6 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">1</div>
                  <div className="font-bold text-[#093e4a] text-sm">Step 1: Sign Up</div>
                  <p className="text-xs text-[#52666a] mt-1">Sign up with your email to create your verified user account.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                  <div className="w-6 h-6 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">2</div>
                  <div className="font-bold text-[#093e4a] text-sm">Step 2: Deposit Funds</div>
                  <p className="text-xs text-[#52666a] mt-1">Deposit funds into your wallet ($1 to $1,000 USD equivalent).</p>
                </div>
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                  <div className="w-6 h-6 rounded-full bg-[#0c5963] text-white font-bold text-xs flex items-center justify-center mb-2">3</div>
                  <div className="font-bold text-[#093e4a] text-sm">Step 3: Buy a Package</div>
                  <p className="text-xs text-[#52666a] mt-1">Choose any package to unlock the system and begin watching ads.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> You <strong>CANNOT</strong> watch ads or earn money without buying an active package. Package ownership activates your daily viewing allocation.
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 3: THE 7 PACKAGES */}
          <section id="sec-packages" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">3</span>
              <h2 className="text-xl font-bold text-[#093e4a]">THE 7 PACKAGES</h2>
            </div>
            <div className="pl-9 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#e5ded0]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f0e6] text-[#093e4a] font-bold text-xs uppercase tracking-wider border-b border-[#e5ded0]">
                    <tr>
                      <th className="py-3 px-4">Package</th>
                      <th className="py-3 px-4">Price (USD)</th>
                      <th className="py-3 px-4">Daily Quota</th>
                      <th className="py-3 px-4">Reward Rate</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece5d8] text-[#374151]">
                    {packages.map((pkg) => (
                      <tr key={pkg.name} className="hover:bg-[#fbf9f6] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#093e4a]">{pkg.name}</td>
                        <td className="py-3 px-4 font-black text-[#0c5963]">{pkg.price}</td>
                        <td className="py-3 px-4 text-xs font-semibold">{pkg.dailyLimit}</td>
                        <td className="py-3 px-4 text-xs font-medium text-emerald-700">{pkg.reward}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-[#eef2f5] text-[#334155]">
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

          {/* SECTION 4: HOW TO EARN */}
          <section id="sec-how-to-earn" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">4</span>
              <h2 className="text-xl font-bold text-[#093e4a]">HOW TO EARN (4 Income Streams)</h2>
            </div>

            <div className="pl-9 space-y-6 text-sm text-[#374151]">
              {/* Stream A */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                <h3 className="font-bold text-[#093e4a] text-base mb-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#0c5963] text-white text-xs">A</span>
                  DAILY AD REWARDS
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#4b5563] ml-2">
                  <li>You watch 60-second verified advertisements.</li>
                  <li>Daily limit: Up to <strong>200 ads per day</strong> (based on package).</li>
                  <li>Reward: <strong>0.1%</strong> of your package price PER ad watched.</li>
                </ul>
                <div className="mt-3 p-3 rounded-lg bg-white border border-[#e2d9cb] text-xs font-medium text-[#093e4a]">
                  <strong>Real Example (Gold $10 package):</strong> 200 ads × $0.01 = <strong>$2.00 / day</strong> ($60.00 / month).
                </div>
              </div>

              {/* Stream B */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                <h3 className="font-bold text-[#093e4a] text-base mb-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#0c5963] text-white text-xs">B</span>
                  UPLINE COMMISSION (When your referrals buy packages)
                </h3>
                <p className="text-xs text-[#52666a] mb-2">
                  Your network is structured <strong>5 levels deep</strong>. You earn these percentages whenever your downline purchases or upgrades a package:
                </p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-[#e2d9cb]">
                    <div className="text-[#64748b] text-[10px]">Level 1</div>
                    <div className="text-base font-extrabold text-[#0c5963]">20%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e2d9cb]">
                    <div className="text-[#64748b] text-[10px]">Level 2</div>
                    <div className="text-base font-extrabold text-[#0c5963]">10%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e2d9cb]">
                    <div className="text-[#64748b] text-[10px]">Level 3</div>
                    <div className="text-base font-extrabold text-[#0c5963]">5%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e2d9cb]">
                    <div className="text-[#64748b] text-[10px]">Level 4</div>
                    <div className="text-base font-extrabold text-[#0c5963]">3%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e2d9cb]">
                    <div className="text-[#64748b] text-[10px]">Level 5</div>
                    <div className="text-base font-extrabold text-[#0c5963]">2%</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#718286] mt-2 italic">
                  Note: You earn on your downline team members (you do NOT earn commissions on your own package purchases).
                </p>
              </div>

              {/* Stream C */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                <h3 className="font-bold text-[#093e4a] text-base mb-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#0c5963] text-white text-xs">C</span>
                  UPLINE COMMISSION (When your referrals watch ads)
                </h3>
                <p className="text-xs text-[#52666a]">
                  You earn <strong>50% commission</strong> of the standard rate when your direct and extended downline members watch daily ads. (Applies across Levels 1 through 5).
                </p>
              </div>

              {/* Stream D: MILESTONE BONUSES */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                <h3 className="font-bold text-[#093e4a] text-base mb-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#0c5963] text-white text-xs">D</span>
                  MILESTONE BONUSES (Claimable Rewards)
                </h3>
                <p className="text-xs text-[#52666a] mb-4">
                  Your ad view count <strong>NEVER resets</strong>. Once you hit a milestone threshold, a bright <strong>"Claim"</strong> button appears in your dashboard. Click it to deposit the bonus directly into your wallet.
                </p>

                {/* Sub D-1: Personal */}
                <div className="mb-6">
                  <div className="font-bold text-xs uppercase tracking-wider text-[#093e4a] mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#0c5963]" />
                    D-1) Personal Milestones (Your own ads):
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-[#e2d9cb]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f0eae0] text-[#093e4a] font-bold">
                        <tr>
                          <th className="py-2 px-3">Ads Watched</th>
                          <th className="py-2 px-3">Bonus ($)</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ece5d8]">
                        {personalMilestones.map((m) => (
                          <tr key={m.ads} className="hover:bg-white transition-colors">
                            <td className="py-2 px-3 font-semibold text-[#1e293b]">{m.ads}</td>
                            <td className="py-2 px-3 font-black text-emerald-700">{m.bonus} USD</td>
                            <td className="py-2 px-3 text-[11px] text-[#64748b]">Instant Claim</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#718286] mt-1.5 italic">(More personal milestones coming soon!)</p>
                </div>

                {/* Sub D-2: Team */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-[#093e4a] mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0c5963]" />
                    D-2) Team Milestones (Collective ads of your whole team)
                  </div>
                  <div className="p-2.5 mb-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    ⭐ IMPORTANT: Your team depth is UNLIMITED (Level 1 to Level 100+). Ads watched by anyone in your entire downline count here!
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-[#e2d9cb]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f0eae0] text-[#093e4a] font-bold">
                        <tr>
                          <th className="py-2 px-3">Total Downline Ads</th>
                          <th className="py-2 px-3">Bonus ($)</th>
                          <th className="py-2 px-3">Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ece5d8]">
                        {teamMilestones.map((m) => (
                          <tr key={m.ads} className="hover:bg-white transition-colors">
                            <td className="py-2 px-3 font-semibold text-[#1e293b]">{m.ads}</td>
                            <td className="py-2 px-3 font-black text-emerald-700">{m.bonus} USD</td>
                            <td className="py-2 px-3 text-[11px] text-[#64748b]">Unlimited Team Depth</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#718286] mt-1.5 italic">(More team milestones coming soon!)</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: WITHDRAWAL RULES */}
          <section id="sec-withdrawal-rules" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">5</span>
              <h2 className="text-xl font-bold text-[#093e4a]">WITHDRAWAL RULES (Read Carefully)</h2>
            </div>
            <div className="pl-9 space-y-3 text-sm text-[#374151]">
              <p className="text-xs text-[#52666a]">
                To maintain security, platform solvency, and fairness for the entire ecosystem, the following rules apply to all withdrawal requests:
              </p>
              <div className="space-y-2">
                {[
                  { title: '1. Minimum Withdrawal', desc: '$1.00 USD' },
                  { title: '2. Maximum Withdrawal', desc: '$1,000.00 USD (per single request)' },
                  { title: '3. Daily Request Limit', desc: 'Only 1 withdrawal request per day' },
                  { title: '4. Time Gap Policy', desc: 'You must wait at least 5 minutes between consecutive requests' },
                  {
                    title: '5. Referral Requirement',
                    desc: 'You MUST have at least 1 active direct referral to withdraw any amount. (If you have 0 referrals, you cannot withdraw).'
                  },
                ].map((rule) => (
                  <div key={rule.title} className="p-3 rounded-lg bg-[#faf8f5] border border-[#e8e0d3] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#093e4a] text-xs">{rule.title}: </span>
                      <span className="text-xs text-[#4b5563]">{rule.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 6: DEPOSIT & WITHDRAWAL METHODS */}
          <section id="sec-methods" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">6</span>
              <h2 className="text-xl font-bold text-[#093e4a]">DEPOSIT & WITHDRAWAL METHODS</h2>
            </div>
            <div className="pl-9 space-y-4 text-sm text-[#374151]">
              <p className="text-xs text-[#52666a]">
                We offer 3 secure payment channels to ensure frictionless access for global and regional members:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method A: Local */}
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                  <div className="font-bold text-[#093e4a] text-sm mb-1">
                    A) LOCAL PAYMENTS (Bank / Easypaisa / JazzCash)
                  </div>
                  <div className="inline-block px-2.5 py-1 rounded-md bg-[#0c5963] text-white text-xs font-black mb-3">
                    Exchange Rate: 1 USD = 300 PKR (Fixed)
                  </div>
                  <ul className="space-y-2 text-xs text-[#4b5563]">
                    <li>
                      <strong>For Deposits:</strong> You send PKR to the official admin account and upload the transaction screenshot/proof. The admin verifies and credits your wallet in USD ($).
                    </li>
                    <li>
                      <strong>For Withdrawals:</strong> You enter your Account Name and Account Number (JazzCash / Easypaisa / Bank). Admin sends the payout directly in PKR.
                    </li>
                  </ul>
                </div>

                {/* Method B: Crypto */}
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e8e0d3]">
                  <div className="font-bold text-[#093e4a] text-sm mb-1">
                    B) CRYPTO (USDT / BTC)
                  </div>
                  <div className="inline-block px-2.5 py-1 rounded-md bg-purple-700 text-white text-xs font-black mb-3">
                    Decentralized & Global
                  </div>
                  <ul className="space-y-2 text-xs text-[#4b5563]">
                    <li>
                      <strong>For Deposits:</strong> You send crypto to the verified admin wallet address and upload the transaction receipt. Admin credits your wallet in USD ($).
                    </li>
                    <li>
                      <strong>For Withdrawals:</strong> You provide your TRC20/BEP20 USDT or Bitcoin address. The finance department sends crypto directly to your wallet.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: HOW TO CLAIM */}
          <section id="sec-claim-milestones" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0c5963] text-white font-bold text-xs">7</span>
              <h2 className="text-xl font-bold text-[#093e4a]">HOW TO CLAIM YOUR MILESTONES</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm text-[#374151]">
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e8e0d3] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#093e4a]">
                  <span className="w-5 h-5 rounded-full bg-[#0c5963] text-white text-[11px] flex items-center justify-center">1</span>
                  <span>Log in and open your Member Dashboard.</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#093e4a]">
                  <span className="w-5 h-5 rounded-full bg-[#0c5963] text-white text-[11px] flex items-center justify-center">2</span>
                  <span>Navigate to the "Milestones" section on the menu.</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#093e4a]">
                  <span className="w-5 h-5 rounded-full bg-[#0c5963] text-white text-[11px] flex items-center justify-center">3</span>
                  <span>Once your goal is reached, the "Claim" button turns bright Green.</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#093e4a]">
                  <span className="w-5 h-5 rounded-full bg-[#0c5963] text-white text-[11px] flex items-center justify-center">4</span>
                  <span>Click "Claim" — the cash bonus is added instantly to your wallet balance.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: FAIR PLAY */}
          <section id="sec-fair-play" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs">8</span>
              <h2 className="text-xl font-bold text-[#991b1b]">FAIR PLAY POLICY (Anti-Cheating)</h2>
            </div>
            <div className="pl-9 space-y-3 text-xs sm:text-sm text-[#374151]">
              <p className="text-xs text-[#52666a]">
                To protect the community and guarantee the long-term sustainability of the ad revenue share model:
              </p>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>Do NOT create multiple accounts</strong> from the same IP address or device.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>Do NOT use VPNs, Tor, or Proxies</strong> to artificially simulate ad views.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>Do NOT use bots, macros, or auto-clicker extensions.</strong></span>
                </div>
              </div>
              <p className="text-xs font-semibold text-red-800">
                ⚠️ Violating these rules will result in an immediate, permanent account ban and forfeiture of all accumulated funds. We value honesty and transparency.
              </p>
            </div>
          </section>

          {/* SECTION 9: DISCLAIMER */}
          <section id="sec-disclaimer" className="mb-10 scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#64748b] text-white font-bold text-xs">9</span>
              <h2 className="text-xl font-bold text-[#093e4a]">IMPORTANT DISCLAIMER</h2>
            </div>
            <div className="pl-9 text-xs sm:text-sm leading-relaxed text-[#4b5563] space-y-2">
              <p>
                <strong>TAEMRY FLUX</strong> is a reward-based advertising platform. It is <strong>NOT</strong> an investment scheme, high-yield investment program (HYIP), or get-rich-quick program.
              </p>
              <p>
                Your earnings depend on your active participation (watching ads, referring users, and building your team). Past earnings do not guarantee future results. The platform reserves the right to update rules with prior notice to ensure long-term sustainability, solvency, and security for all users.
              </p>
            </div>
          </section>

          {/* SECTION 10: JOIN US TODAY */}
          <section id="sec-join-us" className="mb-12 scroll-mt-20">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0c5963] to-[#093e4a] text-white text-center">
              <h2 className="text-2xl font-black mb-2">10. JOIN US TODAY!</h2>
              <p className="text-sm text-[#d0e5e8] max-w-xl mx-auto mb-6">
                Ready to start your journey? Log in to your dashboard, buy your package, and begin watching ads to earn real money. Build your team, hit your milestones, and achieve financial growth with TAEMRY FLUX.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-6 py-3 rounded-xl bg-white text-[#0c5963] font-bold text-sm hover:bg-[#f0f9fa] transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Go to Login / Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 font-semibold text-sm hover:bg-white/20 transition-all cursor-pointer"
                >
                  Explore Home Page
                </button>
              </div>
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS (FAQs) */}
          <section id="sec-faqs" className="pt-8 border-t border-[#ece5d8] scroll-mt-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0c5963]/10 text-[#0c5963] mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl font-extrabold text-[#093e4a]">
                Everything You Need to Know (FAQs)
              </h2>
              <p className="text-xs text-[#6b7280] mt-1">
                Official answers to the top 15 questions asked by TAEMRY FLUX members.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-[#e5ded0] bg-[#faf8f5] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-sm text-[#093e4a] hover:bg-[#f5efe4] transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#0c5963] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#718286] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs sm:text-sm text-[#4b5563] leading-relaxed border-t border-[#efe9dd] bg-white whitespace-pre-line">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Document Footer Signature */}
          <div className="mt-12 pt-6 border-t border-[#ece5d8] text-center text-xs text-[#718286]">
            <p className="font-bold text-[#093e4a]">© 2026 TAEMRY FLUX. All rights reserved.</p>
            <p className="mt-1">Founder & Executive Director: <strong>Taimur Khan'X</strong></p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Published September 2026 • Official Platform Whitepaper v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
