import React, { useState } from 'react';
import {
  X,
  Rocket,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Globe,
  Database,
  Cloud,
  Terminal,
  AlertTriangle,
  Printer
} from 'lucide-react';

export default function GoLiveModal({ isOpen, onClose }) {
  const [copiedSection, setCopiedSection] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
              <Rocket className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>TAEMRY FLUX — Phase 6: Go-Live Master Checklist</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Deploy
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Page production deployment guide for Vercel, Render/Railway, Firebase, and Cloudflare
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-300 leading-relaxed">
          
          {/* Architecture Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Globe className="w-4 h-4" />
                <span>Frontend (Vercel)</span>
              </div>
              <p className="text-[11px] text-slate-400">Vite React SPA, `vercel.json` rewrite</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>Backend (Render)</span>
              </div>
              <p className="text-[11px] text-slate-400">Express API, `render.yaml`, CORS ok</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Firebase Database</span>
              </div>
              <p className="text-[11px] text-slate-400">Firestore, Auth, Storage Rules</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cloudflare DNS</span>
              </div>
              <p className="text-[11px] text-slate-400">Full (Strict) SSL & WAF 60/min</p>
            </div>
          </div>

          {/* Checklist Item 1: Frontend Vercel */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">1</span>
                <span>Vercel Frontend Setup (`/frontend` or root)</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">Build: npm run build</span>
            </div>
            <p className="text-slate-400 text-xs">
              Link your Git repo to Vercel. Preset: <strong>Vite</strong>. Add the environment variables:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-sky-300 overflow-x-auto">
              VITE_API_BASE_URL=https://api.taemryflux.com/api<br />
              VITE_FIREBASE_API_KEY=AIzaSyB...<br />
              VITE_FIREBASE_PROJECT_ID=taemry-flux<br />
              VITE_FIREBASE_AUTH_DOMAIN=taemry-flux.firebaseapp.com
            </div>
          </div>

          {/* Checklist Item 2: Backend Render */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">2</span>
                <span>Render / Railway Backend Deployment</span>
              </h3>
              <span className="text-[11px] font-mono text-purple-400">Root Directory: backend</span>
            </div>
            <p className="text-slate-400 text-xs">
              Set <strong>Build Command</strong>: <code className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">npm install</code> and <strong>Start Command</strong>: <code className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">node server.js</code>.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-purple-300 overflow-x-auto">
              NODE_ENV=production<br />
              PORT=5000<br />
              FRONTEND_URL=https://app.taemryflux.com<br />
              FIREBASE_PROJECT_ID=taemry-flux<br />
              FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@taemry-flux.iam.gserviceaccount.com<br />
              FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...-----END PRIVATE KEY-----\n"
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>Crucial Pitfall:</strong> Keep double quotes around the private key so newlines \n parse correctly.</span>
            </div>
          </div>

          {/* Checklist Item 3: Firestore & Storage Rules */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
                <span>Firebase Security Rules & Admin Seed</span>
              </h3>
              <span className="text-[11px] font-mono text-amber-400">Files: firestore.rules & storage.rules</span>
            </div>
            <p className="text-slate-400 text-xs">
              Deploy rules using Firebase CLI:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-amber-300 flex items-center justify-between">
              <code>firebase deploy --only firestore:rules,storage:rules</code>
              <button
                onClick={() => copyToClipboard('firebase deploy --only firestore:rules,storage:rules', 'firebase-cmd')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedSection === 'firebase-cmd' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checklist Item 4: Cloudflare DNS & SSL */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">4</span>
                <span>Cloudflare DNS, SSL & DDoS WAF</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">Mode: Full (Strict)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong>CNAME app</strong> &rarr; <code className="text-white">cname.vercel-dns.com</code> (Orange Cloud ON)</li>
              <li><strong>CNAME api</strong> &rarr; <code className="text-white">taemry-flux-backend.onrender.com</code> (Orange Cloud ON)</li>
              <li><strong>SSL/TLS</strong>: Full (Strict), Always Use HTTPS enabled.</li>
              <li><strong>WAF Rate Limit</strong>: Max 60 requests/min on path <code className="text-white">/api/*</code>.</li>
            </ul>
          </div>

          {/* Checklist Item 5: Local Testing Commands */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Pre-Launch cURL Validation Commands</span>
            </h3>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div># 1. Health check</div>
              <div className="text-emerald-400">curl -i http://localhost:5000/api/health</div>
              <div># 2. Public settings check</div>
              <div className="text-emerald-400">curl -i http://localhost:5000/api/settings</div>
              <div># 3. Protected ad status check</div>
              <div className="text-emerald-400">curl -i -H "Authorization: Bearer &lt;TOKEN&gt;" http://localhost:5000/api/ads/status</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Full documentation stored in <code className="text-white font-mono">/GO_LIVE_DEPLOYMENT_GUIDE.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20 cursor-pointer"
          >
            Done &bull; Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
