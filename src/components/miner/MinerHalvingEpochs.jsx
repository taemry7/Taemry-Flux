import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Coins,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

const HALVING_STAGES = [
  { level: 1, name: 'Genesis Epoch (Current)', userRange: '0 - 50,000 Users', rate: '16.0 TFLX/h', status: 'active', progress: 76 },
  { level: 2, name: 'Pioneer Halving', userRange: '50,000 - 100,000 Users', rate: '8.0 TFLX/h', status: 'upcoming', progress: 0 },
  { level: 3, name: 'Ecosystem Halving', userRange: '100,000 - 250,000 Users', rate: '4.0 TFLX/h', status: 'upcoming', progress: 0 },
  { level: 4, name: 'Mainnet Halving', userRange: '250,000 - 1,000,000 Users', rate: '2.0 TFLX/h', status: 'upcoming', progress: 0 },
  { level: 5, name: 'Global Scarcity', userRange: '1,000,000+ Users', rate: '1.0 to 0.5 TFLX/h', status: 'upcoming', progress: 0 },
];

export default function MinerHalvingEpochs({ onSelectTab }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4f1] dark:bg-[#0c262e] text-[#0c5963] dark:text-[#38bdf8] flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#09353e] dark:text-white">
                5. Halving Epochs & Deflationary Scarcity
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fefce8] dark:bg-[#201d07] text-[#ca8a04] border border-[#fef08a] dark:border-[#713f12]">
                1B TOKEN HARD-CAP
              </span>
            </div>
            <p className="text-xs text-[#526b70] dark:text-[#94a3b8] mt-0.5">
              Automated coin halving mechanism designed to preserve purchasing power and award early adoption.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#065f46] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#047857]/40 flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            <span>Active Rate: 16.0 TFLX/h</span>
          </span>
        </div>
      </div>

      {/* Current Epoch Progress Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#718589] dark:text-[#94a3b8] uppercase tracking-wider block">
              Current Epoch Progress
            </span>
            <div className="text-xl font-black text-[#09353e] dark:text-white mt-0.5 flex items-center gap-2">
              <span>Genesis Stage (16 TFLX/h)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                76% Complete
              </span>
            </div>
          </div>
          <div className="text-xs font-mono font-bold text-[#0c5963] dark:text-[#38bdf8]">
            38,210 / 50,000 Verified Pioneers
          </div>
        </div>

        <div className="w-full bg-[#f1eee7] dark:bg-[#122b33] h-3 rounded-full overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-[#0c5963] to-[#10b981] h-full rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{ width: '76%' }}
          >
            <div className="absolute inset-0 bg-white/20 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" />
          </div>
        </div>

        <p className="text-xs text-[#526b70] dark:text-[#94a3b8] leading-relaxed">
          When the network reaches 50,000 active nodes, the base mining rate automatically halves from 16.0 TFLX/h to 8.0 TFLX/h. TFLX mined now before the halving represents peak historical yield.
        </p>
      </div>

      {/* Halving Epochs List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0a1b22] border border-[#e4ded2] dark:border-[#173740] shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-white">
          Scheduled Halving Milestones
        </h3>

        <div className="space-y-3 text-xs">
          {HALVING_STAGES.map((stage) => (
            <div
              key={stage.level}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                stage.status === 'active'
                  ? 'bg-[#ecfdf5] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#047857]/50'
                  : 'bg-[#faf8f5] dark:bg-[#07151a] border-[#ece6d9] dark:border-[#173740]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    stage.status === 'active'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {stage.level}
                </div>
                <div>
                  <h4 className="font-bold text-[#09353e] dark:text-white">
                    {stage.name}
                  </h4>
                  <span className="text-[#526b70] dark:text-[#94a3b8] text-[11px]">
                    Adoption Target: {stage.userRange}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#718589] dark:text-[#94a3b8] block">
                    Base Hashrate
                  </span>
                  <span className="font-mono font-bold text-sm text-[#09353e] dark:text-white">
                    {stage.rate}
                  </span>
                </div>

                <div>
                  {stage.status === 'active' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                      Current
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => onSelectTab && onSelectTab('kyc')}
            className="px-4 py-2 rounded-xl bg-[#0c5963] text-white text-xs font-bold hover:bg-[#08424b] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Proceed to 6. Multi-Step KYC & Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
