import React from 'react';
import Logo from './Logo';

export default function Footer({ onNavigate, currentPage }) {
  const isAuthPage = currentPage === 'login';

  return (
    <footer className="border-t border-[#eae4d8] dark:border-[#17323b] bg-[#f5f1e8] dark:bg-[#061418] py-10 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
        <div className={`w-full flex flex-col md:flex-row items-center ${isAuthPage ? 'justify-center' : 'justify-between'} gap-6 text-center md:text-left`}>
          {/* Brand identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline text-[#cbd5e1] dark:text-[#334e57]">•</span>
            <p className="text-xs text-[#52666a] dark:text-[#94a3b8]">
              Your Daily Progress, Made Visible
            </p>
          </div>

          {/* Navigation Quick Links - Hidden on Login/Signup per request */}
          {!isAuthPage && (
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-medium text-[#465a5e] dark:text-[#94a3b8]">
              <button
                onClick={() => {
                  onNavigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => {
                  onNavigate('home');
                  const el = document.getElementById('packages-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
              >
                Packages
              </button>
              <button
                onClick={() => {
                  onNavigate('home');
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
              >
                How it works
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
              >
                Member Login
              </button>
              <button
                onClick={() => onNavigate('support')}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors font-semibold cursor-pointer"
              >
                Support Desk
              </button>
              <button
                onClick={() => onNavigate('whitepaper')}
                className="hover:text-[#0c5963] dark:hover:text-[#38bdf8] transition-colors font-semibold cursor-pointer"
              >
                Whitepaper (v1.0)
              </button>
            </div>
          )}
        </div>

        {/* Copyright notice brought down and centered */}
        <div className="w-full pt-6 border-t border-[#eae4d8]/60 dark:border-[#17323b]/60 flex items-center justify-center text-center text-xs text-[#718286] dark:text-[#627a80]">
          © 2026 TAEMRY FLUX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
