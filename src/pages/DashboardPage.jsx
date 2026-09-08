import React, { useState } from 'react';
import { 
  ArrowRight, 
  Wallet, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownCircle, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ activeTab = 'overview', onSelectTab }) {
  const { currentUser } = useAuth();

  // Local state for interactive features shown in the video
  const [balance, setBalance] = useState(0.00);
  const [todayViews, setTodayViews] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState('bronze');
  const [activePackage, setActivePackage] = useState(null);
  const [depositAmount, setDepositAmount] = useState('10');
  const [depositMethod, setDepositMethod] = useState('Bank transfer');
  const [depositNote, setDepositNote] = useState('');
  const [depositRequests, setDepositRequests] = useState([]);
  const [viewingAd, setViewingAd] = useState(null);
  const [adTimer, setAdTimer] = useState(30);
  const [successToast, setSuccessToast] = useState('');

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'TAEMRY Member';
  const userEmail = currentUser?.email || 'member@taemryflux.com';

  // Available packages
  const packagesList = [
    { id: 'bronze', name: 'Bronze', entry: '$1.00', rewardRate: '0.001% per view', dailyMax: 20 },
    { id: 'silver', name: 'Silver', entry: '$5.00', rewardRate: '0.001% per view', dailyMax: 40 },
    { id: 'gold', name: 'Gold', entry: '$10.00', rewardRate: '0.001% per view', dailyMax: 60 },
    { id: 'platinum', name: 'Platinum', entry: '$25.00', rewardRate: '0.002% per view', dailyMax: 80 },
    { id: 'diamond', name: 'Diamond', entry: '$50.00', rewardRate: '0.002% per view', dailyMax: 100 },
    { id: 'master', name: 'Master', entry: '$100.00', rewardRate: '0.003% per view', dailyMax: 120 },
    { id: 'apex', name: 'Apex', entry: '$250.00', rewardRate: '0.005% per view', dailyMax: 150 },
  ];

  // Ad items for Daily Views
  const adItems = [
    {
      id: 'ad-1',
      title: 'Welcome to TAEMRY',
      desc: 'Learn how daily ad rewards work on the platform.',
      duration: '30s view',
      rate: '+0.00% reward'
    },
    {
      id: 'ad-2',
      title: 'Build your daily streak',
      desc: 'Stay consistent and make progress one view at a time.',
      duration: '30s view',
      rate: '+0.00% reward'
    },
    {
      id: 'ad-3',
      title: 'Your wallet, your progress',
      desc: 'Keep an eye on your balance and daily earnings.',
      duration: '30s view',
      rate: '+0.00% reward'
    },
  ];

  // Handle deposit submission
  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    const newRequest = {
      id: 'DEP-' + Math.floor(1000 + Math.random() * 9000),
      amount: `$${Number(depositAmount).toFixed(2)}`,
      method: depositMethod,
      note: depositNote || 'Wallet Funding Request',
      date: new Date().toLocaleDateString(),
      status: 'Pending Verification'
    };

    setDepositRequests([newRequest, ...depositRequests]);
    setSuccessToast(`Deposit request of $${depositAmount} submitted! Awaiting verification.`);
    setDepositNote('');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Handle Package Activation
  const handleActivatePackage = (pkgId) => {
    const pkg = packagesList.find(p => p.id === pkgId);
    setActivePackage(pkg);
    setSuccessToast(`${pkg.name} Package activated! Your daily view allocation is now active.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Simulate Timed Ad View
  const handleStartView = (ad) => {
    setViewingAd(ad);
    setAdTimer(3); // 3 seconds preview simulation
    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setViewingAd(null);
          setTodayViews((v) => v + 1);
          setBalance((b) => Number((b + 0.05).toFixed(2)));
          setSuccessToast(`View completed! Reward credited to your wallet.`);
          setTimeout(() => setSuccessToast(''), 3500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#0c5963] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* PHASE 1 REQUIRED WELCOME BANNER */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#e6f4f1] border border-[#bde2db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0c5963] text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#09353e]">
              Welcome, <span className="text-[#0c5963]">{userEmail}</span>!
            </h2>
            <p className="text-xs text-[#526d72]">
              Your dashboard is in Phase 1 development mode. All core flows are functional.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider bg-white text-[#0c5963] px-2.5 py-1 rounded-full border border-[#b8dfd7] self-end sm:self-auto">
          Phase 1 Active
        </span>
      </div>

      {/* TAB 1: OVERVIEW (Exact replica from the screen video) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              MEMBER OVERVIEW
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
              Good to see you, {userName}.
            </h1>
            <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
              Your wallet and daily progress, without the noise.
            </p>
          </div>

          {/* Quick CTA */}
          <div className="bg-[#0c5963] text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <span className="text-xs sm:text-sm font-semibold">
              Continue today's session
            </span>
            <button
              onClick={() => onSelectTab('daily-views')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#0c5963] hover:bg-[#e6f4f1] text-xs font-bold rounded-xl transition-all"
            >
              <span>Continue today</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Available Balance Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#73888d] uppercase tracking-wider block mb-1">
                  AVAILABLE BALANCE
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-[#09353e] tracking-tight">
                  ${balance.toFixed(2)}
                </div>
                <p className="text-xs text-[#526d72] mt-2">
                  {activePackage ? (
                    <span className="text-[#0c5963] font-semibold">
                      Active: {activePackage.name} Package ({activePackage.rewardRate})
                    </span>
                  ) : (
                    'Choose a package to start earning'
                  )}
                </p>
              </div>

              <button
                onClick={() => onSelectTab('deposit')}
                className="w-11 h-11 rounded-2xl bg-[#e6f4f1] text-[#0c5963] hover:bg-[#d5ece7] flex items-center justify-center transition-colors shadow-xs"
                title="Fund wallet"
              >
                <Wallet className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-[#f1eee8] flex items-center gap-2 text-xs text-[#5a7277]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span>${todayViews > 0 ? (todayViews * 0.05).toFixed(2) : '0.00'} earned today</span>
            </div>
          </div>

          {/* Today's Rhythm Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e4ded2] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#73888d] uppercase tracking-wider">
                TODAY'S RHYTHM
              </span>
              <Clock className="w-4 h-4 text-[#e89b27]" />
            </div>

            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-3xl font-extrabold text-[#09353e]">{todayViews}</span>
              <span className="text-lg font-bold text-[#8a9ca0]">/ 100</span>
              <span className="text-xs text-[#63797e] ml-2">views completed today</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#f1eee7] h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-[#0c5963] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(todayViews, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-[#71878b]">
              {100 - todayViews} views left today
            </p>
          </div>

          {/* Latest Activity / Reward Ledger */}
          <div className="bg-white rounded-3xl p-6 border border-[#e4ded2] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#09353e]">Latest Activity</span>
              <button
                onClick={() => onSelectTab('daily-views')}
                className="text-xs font-semibold text-[#0c5963] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#09353e]">
                {todayViews > 0 ? `${todayViews} Views Logged` : 'Your first reward is close'}
              </h4>
              <p className="text-xs text-[#63797e] max-w-xs mt-1 mb-4">
                Complete a timed view and it will appear here.
              </p>
              <button
                onClick={() => onSelectTab('daily-views')}
                className="text-xs font-bold text-[#0c5963] hover:text-[#083e46] inline-flex items-center gap-1 bg-[#f5f1e8] px-3.5 py-2 rounded-xl"
              >
                <span>Explore daily views</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Callout ("YOUR EDGE") */}
          <div className="p-6 rounded-3xl bg-[#f5f1e8] border border-[#e7e1d4]">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              YOUR EDGE
            </span>
            <h4 className="text-lg font-bold text-[#09353e] mt-1 mb-1">
              Small actions compound.
            </h4>
            <p className="text-xs text-[#526b70] leading-relaxed mb-4">
              Keep your daily views consistent. TAEMRY shows the progress so you can make the next decision with confidence.
            </p>
            <button
              onClick={() => onSelectTab('packages')}
              className="text-xs font-bold text-[#0c5963] hover:underline inline-flex items-center gap-1"
            >
              <span>Review packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY VIEWS */}
      {activeTab === 'daily-views' && (
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              DAILY VIEWS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
              Make today count
            </h1>
            <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
              Each view is timed so your reward stays transparent. Watch at your own pace, then come back tomorrow.
            </p>
          </div>

          {/* Daily Progress Pill */}
          <div className="bg-white rounded-2xl p-4 border border-[#e4ded2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e6f4f1] text-[#0c5963] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#09353e]">
                {todayViews} / 100 Today
              </span>
            </div>
            <span className="text-xs text-[#5f7478]">
              {100 - todayViews} views remaining
            </span>
          </div>

          {/* Ad viewing simulation banner */}
          {viewingAd && (
            <div className="p-6 bg-[#09353e] text-white rounded-3xl border border-[#134954] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-[#34d399] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34d399] animate-ping" />
                  Viewing: {viewingAd.title}
                </span>
                <span className="text-sm font-mono font-bold bg-white/10 px-3 py-1 rounded-lg">
                  {adTimer}s left
                </span>
              </div>
              <p className="text-xs text-[#9db7bd] mb-4">
                Please remain on this page until the timer expires to credit your reward.
              </p>
              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#34d399] h-full transition-all duration-1000"
                  style={{ width: `${((3 - adTimer) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Ad Item Cards */}
          <div className="space-y-4">
            {adItems.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-2xl p-5 border border-[#e4ded2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f1e8] text-[#0c5963] flex items-center justify-center flex-shrink-0">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#09353e]">{ad.title}</h4>
                      <span className="text-[10px] font-mono text-[#718588] bg-[#f5f1e8] px-2 py-0.5 rounded">
                        {ad.duration}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f7478] mt-0.5">{ad.desc}</p>
                    <span className="text-[11px] font-semibold text-[#0c5963] mt-1 inline-block">
                      {ad.rate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartView(ad)}
                  disabled={Boolean(viewingAd)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0c5963] hover:bg-[#09424a] disabled:opacity-50 text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Start view</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              EARNING PACKAGES
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
              Choose your pace
            </h1>
            <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
              One active package sets the reward rate for your daily views. Pick the level that fits your wallet today.
            </p>
          </div>

          {/* Package Selection Cards */}
          <div className="space-y-3.5">
            {packagesList.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              const isActive = activePackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0c5963] ring-2 ring-[#0c5963]/20 shadow-sm'
                      : 'border-[#e4ded2] hover:border-[#b8ced2]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider text-[#73888d] uppercase">
                      PACKAGE
                    </span>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="text-[10px] font-bold text-[#0c5963] bg-[#e6f4f1] px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#0c5963] bg-[#0c5963] text-white'
                            : 'border-[#cbd5e1]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#09353e] mb-2">{pkg.name}</h3>

                  <div className="flex items-baseline justify-between pt-2 border-t border-[#f4f0e7] text-xs">
                    <div>
                      <span className="text-[10px] text-[#788e93] block uppercase">
                        Wallet Entry
                      </span>
                      <span className="text-base font-extrabold text-[#09353e]">
                        {pkg.entry}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#788e93] block uppercase">
                        Per View
                      </span>
                      <span className="text-xs font-semibold text-[#0c5963]">
                        {pkg.rewardRate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky/Bottom Activate Action Bar */}
          <div className="p-5 bg-white rounded-2xl border border-[#ded8cc] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#09353e]">
                Ready to activate {packagesList.find(p => p.id === selectedPackage)?.name}?
              </p>
              <p className="text-[11px] text-[#63797e]">
                The package price will be taken from your wallet balance.
              </p>
            </div>
            <button
              onClick={() => handleActivatePackage(selectedPackage)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>Activate package</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DEPOSIT */}
      {activeTab === 'deposit' && (
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              WALLET FUNDING
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
              Add to your wallet
            </h1>
            <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
              Submit a manual deposit, then keep an eye on its approval trail below.
            </p>
          </div>

          {/* Deposit Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e4ded2] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#63797e] mb-4">
              NEW REQUEST: Deposit details
            </h3>

            <form onSubmit={handleDepositSubmit} className="space-y-5">
              {/* Amount Selection Chips */}
              <div>
                <label className="block text-xs font-semibold text-[#3a545a] mb-2">
                  Amount (USD)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['1', '5', '10'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        depositAmount === amt
                          ? 'bg-[#0c5963] text-white border-[#0c5963]'
                          : 'bg-[#faf8f5] text-[#09353e] border-[#d8d1c3] hover:bg-[#f2eee5]'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Or enter custom amount"
                  className="w-full px-4 py-2.5 text-sm bg-[#faf8f5] border border-[#d8d1c3] rounded-xl focus:outline-none focus:border-[#0c5963]"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#3a545a] mb-1.5">
                  Payment method
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#faf8f5] border border-[#d8d1c3] rounded-xl focus:outline-none focus:border-[#0c5963] text-[#09353e]"
                >
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Crypto wallet">Crypto wallet (USDT TRC20 / BEP20)</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-xs font-semibold text-[#3a545a] mb-1.5">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Optional reference or transfer note (e.g. Transaction ID)"
                  className="w-full px-4 py-2.5 text-sm bg-[#faf8f5] border border-[#d8d1c3] rounded-xl focus:outline-none focus:border-[#0c5963] text-[#09353e]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Submit deposit request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Deposit Requests Trail */}
          <div className="bg-white rounded-3xl p-6 border border-[#e4ded2] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#63797e]">
                YOUR TRAIL: Deposit requests
              </span>
              <span className="text-xs text-[#718588]">{depositRequests.length} total</span>
            </div>

            {depositRequests.length === 0 ? (
              <div className="py-8 text-center text-[#7a8f94]">
                <p className="text-xs font-semibold">No requests yet</p>
                <p className="text-[11px] mt-1 text-[#8fa1a5]">
                  Your approved deposit requests will become wallet balance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {depositRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-[#faf8f5] rounded-xl border border-[#ebe5d9] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#09353e]">{req.amount}</span>
                        <span className="text-[10px] text-[#556f74] bg-[#eae4d8] px-2 py-0.5 rounded">
                          {req.method}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#718588] mt-0.5">{req.note}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#ca8a04] bg-[#fef9c3] px-2.5 py-1 rounded-full border border-[#fde047]">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0d5963] uppercase">
              WALLET OUTFLOW
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#09353e] mt-1">
              Withdrawals are next
            </h1>
            <p className="text-xs sm:text-sm text-[#546b70] mt-0.5">
              Phase 1 keeps the focus on building a clear earning rhythm. Withdrawals will arrive here in a future release.
            </p>
          </div>

          {/* Placeholder Banner */}
          <div className="bg-[#e6f4f1] rounded-3xl p-7 border border-[#bce2db]">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c5963] bg-white px-3 py-1 rounded-full mb-3 shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Phase 1 placeholder</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#09353e] mb-2">
              Keep your balance growing.
            </h3>
            <p className="text-xs sm:text-sm text-[#4c676d] leading-relaxed max-w-lg mb-6">
              For now, use your wallet to activate a package and complete daily views. We'll keep this space reserved for a thoughtful withdrawal flow in Phase 2.
            </p>
            <button
              onClick={() => onSelectTab('overview')}
              className="px-5 py-2.5 bg-[#0c5963] hover:bg-[#09424a] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Return to wallet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
