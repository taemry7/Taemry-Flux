import React from 'react';
import Logo from './Logo';

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-[#eae4d8] bg-[#f5f1e8] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand identity */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Logo size="sm" />
          <span className="hidden sm:inline text-[#cbd5e1]">•</span>
          <p className="text-xs text-[#52666a]">
            Your daily progress, made visible.
          </p>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-medium text-[#465a5e]">
          <button
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-[#0c5963] transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('home');
              const el = document.getElementById('packages-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#0c5963] transition-colors"
          >
            Packages
          </button>
          <button
            onClick={() => {
              onNavigate('home');
              const el = document.getElementById('how-it-works');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#0c5963] transition-colors"
          >
            How it works
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="hover:text-[#0c5963] transition-colors"
          >
            Member Login
          </button>
          <button
            onClick={() => onNavigate('support')}
            className="hover:text-[#0c5963] transition-colors font-semibold"
          >
            Support Desk
          </button>
          <button
            onClick={() => onNavigate('whitepaper')}
            className="hover:text-[#0c5963] transition-colors font-semibold"
          >
            Whitepaper (v1.0)
          </button>
        </div>

        {/* Copyright notice required by user prompt */}
        <div className="text-xs text-[#718286]">
          © 2026 TAEMRY FLUX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
