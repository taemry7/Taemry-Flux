/**
 * TAEMRY FLUX - Deposit System (Phase 4)
 * Allows users to review official admin payment accounts, calculate PKR conversions,
 * upload proof-of-payment receipts, and submit deposit requests with real-time feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowDownCircle,
  Building2,
  Smartphone,
  Coins,
  Copy,
  Check,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../config/milestones.config';

export default function DepositPage({ onSelectTab, onNavigate }) {
  const { userStats, fetchUserStats } = useAuth();

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState('jazzcash'); // 'bank' | 'easypaisa' | 'jazzcash' | 'crypto'
  const [amountUSD, setAmountUSD] = useState('10');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Data states
  const [paymentDetails, setPaymentDetails] = useState({
    exchangeRate: 300,
    bankAccountName: 'TAEMRY FLUX HOLDINGS LTD',
    bankAccountNumber: 'PK76MEZN0000123456789012',
    bankName: 'Meezan Bank Ltd',
    easypaisaNumber: '03451234567',
    easypaisaName: 'TAEMRY OFFICIAL',
    jazzcashNumber: '03009876543',
    jazzcashName: 'TAEMRY OFFICIAL',
    cryptoAddresses: {
      USDT: '0x71C2d389a9fB08a9B4cE50bE2390aFa872B5498d (TRC20 / BEP20)',
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
  });

  const [depositHistory, setDepositHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });

  const fileInputRef = useRef(null);

  // Fetch admin payment details and past deposit history
  const loadData = async () => {
    try {
      setLoadingDetails(true);
      const [detailsRes, historyRes] = await Promise.all([
        apiClient.get('/deposits/payment-details').catch(() => null),
        apiClient.get('/deposits/my-deposits').catch(() => null),
      ]);

      if (detailsRes?.data?.paymentDetails) {
        setPaymentDetails(detailsRes.data.paymentDetails);
      }

      if (historyRes?.data?.deposits) {
        setDepositHistory(historyRes.data.deposits);
      }
    } catch (err) {
      console.warn('Error loading deposit information:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  // Helper to compress screenshot images before uploading to prevent network timeouts
  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  { type: 'image/jpeg', lastModified: Date.now() }
                );
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.82
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection with auto compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({
        type: 'error',
        text: 'File size exceeds 10MB limit. Please choose a smaller image.',
      });
      return;
    }

    try {
      const optimizedFile = await compressImage(file);
      setScreenshotFile(optimizedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(optimizedFile);
    } catch {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit deposit request
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setToastMessage({ type: '', text: '' });

    if (selectedMethod === 'bank' || selectedMethod === 'crypto') {
      setToastMessage({
        type: 'error',
        text: 'Not Available for Now. Please select JazzCash or Easypaisa.',
      });
      return;
    }

    const parsedAmount = parseFloat(amountUSD);
    if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 1000) {
      setToastMessage({
        type: 'error',
        text: 'Please enter a valid amount between $1.00 and $1,000.00 USD.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('method', selectedMethod);
      formData.append('amountUSD', parsedAmount.toString());
      if (transactionId) formData.append('transactionId', transactionId);
      if (screenshotFile) formData.append('screenshot', screenshotFile);

      const res = await apiClient.post('/deposits/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      if (res.data?.success) {
        setToastMessage({
          type: 'success',
          text: 'Deposit request submitted! Wait for admin approval.',
        });

        // Clear form
        setAmountUSD('10');
        setTransactionId('');
        setScreenshotFile(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Reload history & update user balance in background
        loadData();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error submitting deposit:', err);
      let errorMsg = err.response?.data?.message || err.message || 'Failed to submit deposit request. Please try again.';
      if (err.code === 'ECONNABORTED' || errorMsg.toLowerCase().includes('timeout')) {
        errorMsg = 'Network connection timed out. Please check your internet connection and try submitting again.';
      }
      setToastMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculated conversions
  const exchangeRate = paymentDetails.exchangeRate || 300;
  const numUSD = parseFloat(amountUSD) || 0;
  const isLocal = ['bank', 'easypaisa', 'jazzcash'].includes(selectedMethod);
  const calculatedPKR = Math.round(numUSD * exchangeRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Transaction Engine
            </span>
            <span className="hidden text-xs font-semibold text-[#5a7277]">
              Rate: <strong>$1 = {exchangeRate} PKR</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Deposit Funds & Account Top-up
          </h1>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#ede7dc] text-[#526d72] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDetails ? 'animate-spin' : ''}`} />
          <span>Refresh Rates</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {toastMessage.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]'
              : 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage({ type: '', text: '' })}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form on Left, Admin Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deposit Submission Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0ebe0] pb-4">
            <h2 className="text-lg font-extrabold text-[#09353e] flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-[#0c5963]" />
              <span>Step 1: Choose Payment Method</span>
            </h2>
            <span className="hidden text-xs text-[#718589] font-semibold">Instant verification</span>
          </div>

          {/* Payment Method Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMethod('jazzcash')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                selectedMethod === 'jazzcash'
                  ? 'border-[#0c5963] bg-[#0c5963]/5 text-[#0c5963] ring-2 ring-[#0c5963]/20 shadow-xs'
                  : 'border-[#e4ded2] hover:bg-[#faf8f5] text-[#526d72]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs overflow-hidden p-0.5 border border-[#e4ded2]">
                <img src="/jazzcash.png" alt="JazzCash" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-bold">JazzCash</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('easypaisa')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                selectedMethod === 'easypaisa'
                  ? 'border-[#0c5963] bg-[#0c5963]/5 text-[#0c5963] ring-2 ring-[#0c5963]/20 shadow-xs'
                  : 'border-[#e4ded2] hover:bg-[#faf8f5] text-[#526d72]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs overflow-hidden p-0.5 border border-[#e4ded2]">
                <img src="/easypaisa.png" alt="Easypaisa" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-bold">Easypaisa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMethod('bank');
                setToastMessage({
                  type: 'error',
                  text: 'Not Available for Now. Please select JazzCash or Easypaisa.',
                });
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                selectedMethod === 'bank'
                  ? 'border-[#ea580c] bg-[#ea580c]/5 text-[#c2410c] ring-2 ring-[#ea580c]/20 shadow-xs'
                  : 'border-[#e4ded2] hover:bg-[#faf8f5] text-[#526d72]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#0284c7] flex items-center justify-center shadow-xs overflow-hidden p-1 text-white">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <rect width="32" height="32" rx="6" fill="#0284c7" />
                  <path d="M7 11L16 6L25 11H7Z" fill="#FFFFFF" />
                  <rect x="9" y="13" width="2.4" height="8" rx="0.5" fill="#FFFFFF" />
                  <rect x="13.3" y="13" width="2.4" height="8" rx="0.5" fill="#FFFFFF" />
                  <rect x="17.6" y="13" width="2.4" height="8" rx="0.5" fill="#FFFFFF" />
                  <rect x="21.9" y="13" width="2.4" height="8" rx="0.5" fill="#FFFFFF" />
                  <rect x="6" y="22" width="20" height="2.2" rx="0.5" fill="#FFFFFF" />
                  <circle cx="23.5" cy="23.5" r="4.5" fill="#38BDF8" stroke="#0284c7" strokeWidth="1" />
                  <path d="M21.5 23.5H24.5M24.5 23.5L23.2 22M24.5 23.5L23.2 25" stroke="#09353e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xs font-bold">Bank Transfer</span>
              <span className="text-[9px] font-bold text-[#b45309] bg-[#fef3c7] px-1.5 py-0.5 rounded-md leading-none">
                Not Available for Now
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMethod('crypto');
                setToastMessage({
                  type: 'error',
                  text: 'Not Available for Now. Please select JazzCash or Easypaisa.',
                });
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                selectedMethod === 'crypto'
                  ? 'border-[#ea580c] bg-[#ea580c]/5 text-[#c2410c] ring-2 ring-[#ea580c]/20 shadow-xs'
                  : 'border-[#e4ded2] hover:bg-[#faf8f5] text-[#526d72]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#26A17B] flex items-center justify-center shadow-xs overflow-hidden p-1 text-white">
                <img src="/usdt.png" alt="Crypto (USDT)" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold">Crypto (USDT)</span>
              <span className="text-[9px] font-bold text-[#b45309] bg-[#fef3c7] px-1.5 py-0.5 rounded-md leading-none">
                Not Available for Now
              </span>
            </button>
          </div>

          {/* Not Available for Now Alert for Bank / Crypto */}
          {(selectedMethod === 'bank' || selectedMethod === 'crypto') && (
            <div className="p-4 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#ea580c] mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-black uppercase tracking-wider text-[#9a3412]">
                  Not Available for Now
                </p>
                <p className="text-[#c2410c] mt-0.5">
                  {selectedMethod === 'bank' ? 'Bank Transfer' : 'Crypto (USDT)'} is currently not available for deposit. Please use{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('jazzcash')}
                    className="font-bold underline text-[#9a3412] hover:text-[#7c2d12] cursor-pointer"
                  >
                    JazzCash
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('easypaisa')}
                    className="font-bold underline text-[#9a3412] hover:text-[#7c2d12] cursor-pointer"
                  >
                    Easypaisa
                  </button>{' '}
                  instead.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitDeposit} className="space-y-5">
            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e]">
                  Amount in USD ($)
                </label>
                <span className="text-[11px] text-[#718589]">Min: $1 • Max: $1,000</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#718589]">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="any"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  required
                  placeholder="10.00"
                  className="w-full pl-9 pr-4 py-3 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-base font-bold text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20 transition-all"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {['1', '5', '10', '25', '100', '500', '1000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountUSD(preset)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      amountUSD === preset
                        ? 'bg-[#0c5963] text-white border-[#0c5963]'
                        : 'bg-white text-[#526d72] border-[#e4ded2] hover:bg-[#faf8f5]'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Calculated PKR Display (for local methods) */}
            {isLocal && (
              <div className="p-4 rounded-2xl bg-[#e6f4f1] border border-[#b8dfd7] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0c5963]">
                    Amount to Transfer (PKR)
                  </span>
                  <p className="text-xl font-black text-[#09353e]">
                    ₨ {calculatedPKR.toLocaleString()} PKR
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#4d7077] font-semibold block">Calculated at:</span>
                  <span className="text-xs font-bold text-[#0c5963]">$1 = {exchangeRate} PKR</span>
                </div>
              </div>
            )}

            {/* Transaction ID / Reference (Optional) */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                Transaction ID / Sender Name (Optional)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TID-982183 or sender phone number"
                className="w-full px-4 py-2.5 bg-[#faf8f5] border border-[#d8d1c3] rounded-2xl text-xs font-medium text-[#09353e] focus:outline-none focus:border-[#0c5963] focus:ring-2 focus:ring-[#0c5963]/20"
              />
            </div>

            {/* Screenshot Receipt Upload */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#09353e] block mb-1.5">
                Payment Proof Screenshot
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#cbd5e1] hover:border-[#0c5963] rounded-2xl p-4 text-center cursor-pointer bg-[#faf8f5] transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                />

                {screenshotPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={screenshotPreview}
                      alt="Receipt Preview"
                      className="max-h-36 object-contain rounded-xl border border-[#e4ded2] shadow-xs"
                    />
                    <span className="text-xs font-bold text-[#0c5963] group-hover:underline">
                      Click to change image
                    </span>
                    <span className="text-[11px] text-[#718589]">
                      {screenshotFile?.name} ({(screenshotFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-3">
                    <div className="w-10 h-10 rounded-full bg-white text-[#0c5963] flex items-center justify-center shadow-xs border border-[#e4ded2] group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#09353e]">
                      Click to browse or drag & drop payment receipt
                    </p>
                    <p className="text-[11px] text-[#718589]">
                      Supports PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            {selectedMethod === 'bank' || selectedMethod === 'crypto' ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-6 bg-[#fed7aa] text-[#9a3412] text-sm font-extrabold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 select-none border border-[#fdba74]"
              >
                <AlertCircle className="w-4 h-4 text-[#ea580c]" />
                <span>Not Available for Now</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-[#0c5963] hover:bg-[#08424b] text-white text-sm font-extrabold rounded-2xl shadow-sm shadow-[#0c5963]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Deposit Request...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Deposit Request (${amountUSD || '0'})</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Step 2: Official Admin Payment Destination Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#112d35] text-white rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#0c5963]/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#38bdf8]">
                  Official Admin Receiver
                </span>
                <span className="text-[11px] text-white/70 font-mono">
                  Method: <strong className="text-white uppercase">{selectedMethod}</strong>
                </span>
              </div>

              {/* JAZZCASH DETAILS */}
              {selectedMethod === 'jazzcash' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      JazzCash Account Title
                    </span>
                    <p className="text-sm font-bold text-white">{paymentDetails.jazzcashName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      JazzCash Account / Mobile Number
                    </span>
                    <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-xl border border-white/10 mt-1">
                      <span className="text-base font-mono font-black text-[#38bdf8]">
                        {paymentDetails.jazzcashNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(paymentDetails.jazzcashNumber, 'jc')}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'jc' ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'jc' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EASYPAISA DETAILS */}
              {selectedMethod === 'easypaisa' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      Easypaisa Account Title
                    </span>
                    <p className="text-sm font-bold text-white">{paymentDetails.easypaisaName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      Easypaisa Account / Mobile Number
                    </span>
                    <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-xl border border-white/10 mt-1">
                      <span className="text-base font-mono font-black text-[#4ade80]">
                        {paymentDetails.easypaisaNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(paymentDetails.easypaisaNumber, 'ep')}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'ep' ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ep' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* NOT AVAILABLE FOR NOW (BANK & CRYPTO) */}
              {(selectedMethod === 'bank' || selectedMethod === 'crypto') && (
                <div className="py-6 text-center space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">
                      Not Available for Now
                    </h3>
                    <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed">
                      {selectedMethod === 'bank' ? 'Bank Transfer' : 'Crypto (USDT)'} is currently not available. Please switch to JazzCash or Easypaisa to proceed with your deposit.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('jazzcash')}
                      className="px-3 py-1.5 bg-[#e89b27] hover:bg-[#d98a18] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Use JazzCash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('easypaisa')}
                      className="px-3 py-1.5 bg-[#00a859] hover:bg-[#008f4c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Use Easypaisa
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="pt-2 border-t border-white/10 text-[11px] text-white/70 space-y-1">
                <p>1. Send the exact calculated amount to the verified account above.</p>
                <p>2. Capture a full screenshot of the completed transfer.</p>
                <p>3. Upload receipt proof and submit. Approval completes in ~15 minutes.</p>
              </div>
            </div>
          </div>

          {/* Quick Wallet Summary Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589]">
                Current Wallet Balance
              </span>
              <p className="text-2xl font-black text-[#0c5963]">
                {formatCurrency(userStats?.walletBalance ?? 0)}
              </p>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('withdraw')}
              className="px-4 py-2 bg-[#faf8f5] hover:bg-[#ede7dc] text-[#09353e] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-colors cursor-pointer"
            >
              Withdraw Funds
            </button>
          </div>
        </div>
      </div>

      {/* Recent Deposits History Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e4ded2] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#09353e]">
              Recent Deposit Requests
            </h3>
            <p className="text-xs text-[#718589]">
              Track the status of your submitted deposit proofs
            </p>
          </div>
          <span className="text-xs font-bold text-[#0c5963] bg-[#e6f4f1] px-2.5 py-1 rounded-full border border-[#b8dfd7]">
            {depositHistory.length} Rec
          </span>
        </div>

        {depositHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#718589] border border-dashed border-[#e4ded2] rounded-2xl">
            <FileText className="w-8 h-8 mx-auto text-[#a0b0b3] mb-2" />
            No deposits submitted yet. Choose a payment method above to make your first deposit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0ebe0] text-[#718589] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Amount USD</th>
                  <th className="py-3 px-3">Amount PKR</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f1e8]">
                {depositHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#faf8f5]">
                    <td className="py-3 px-3 text-[#526d72] font-mono whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#09353e] uppercase">
                      {item.method}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0c5963]">
                      ${Number(item.amountUSD).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[#526d72]">
                      {item.amountPKR ? `₨ ${item.amountPKR.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.status === 'approved'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : item.status === 'rejected'
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-[#fef3c7] text-[#b45309]'
                        }`}
                      >
                        {item.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                        {item.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {item.screenshotURL ? (
                        <a
                          href={item.screenshotURL}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0c5963] hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>View Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#a0b0b3]">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
