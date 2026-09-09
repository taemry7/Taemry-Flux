/**
 * TAEMRY FLUX - Transaction History & Ledger Page (Phase 4)
 * Displays all chronological financial movements:
 * - Green for credits (deposit, ad reward, commission, milestone bonus)
 * - Red for debits (package purchase, withdrawal)
 * Supports type filters, search, and pagination.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Award,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Download,
  Wallet
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../config/milestones.config';

export default function TransactionHistory() {
  const { userStats } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/transactions?limit=100');
      if (res.data?.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter & Search
  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = selectedFilter === 'all' || tx.type === selectedFilter;
    const matchesSearch =
      searchQuery === '' ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.type && tx.type.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Type metadata and color tags
  const getTypeMeta = (type, amount) => {
    const isPositive = Number(amount) >= 0;
    switch (type) {
      case 'ad_reward':
        return {
          label: 'Ad Reward',
          icon: Sparkles,
          color: 'text-[#059669] bg-[#d1fae5] border-[#a7f3d0]',
          isCredit: true,
        };
      case 'deposit':
        return {
          label: 'Deposit',
          icon: ArrowDownLeft,
          color: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]',
          isCredit: true,
        };
      case 'commission':
        return {
          label: 'Referral Commission',
          icon: TrendingUp,
          color: 'text-[#0d9488] bg-[#ccfbf1] border-[#99f6e4]',
          isCredit: true,
        };
      case 'milestone_bonus':
        return {
          label: 'Milestone Bonus',
          icon: Award,
          color: 'text-[#ca8a04] bg-[#fef9c3] border-[#fde047]',
          isCredit: true,
        };
      case 'package_purchase':
        return {
          label: 'Package Purchase',
          icon: ShoppingBag,
          color: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
          isCredit: false,
        };
      case 'withdrawal':
        return {
          label: 'Withdrawal',
          icon: ArrowUpRight,
          color: 'text-[#e11d48] bg-[#ffe4e6] border-[#fecdd3]',
          isCredit: false,
        };
      default:
        return {
          label: type?.replace('_', ' ') || 'Transaction',
          icon: History,
          color: isPositive
            ? 'text-[#059669] bg-[#d1fae5] border-[#a7f3d0]'
            : 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
          isCredit: isPositive,
        };
    }
  };

  // Summary inflows & outflows
  const totalInflow = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalOutflow = transactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0c5963] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full border border-[#b8dfd7]">
              Financial Audit Ledger
            </span>
            <span className="text-xs font-semibold text-[#5a7277]">
              Total Records: <strong>{transactions.length}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#09353e] tracking-tight">
            Transaction History
          </h1>
        </div>

        <button
          onClick={fetchTransactions}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#ede7dc] text-[#526d72] text-xs font-bold rounded-xl border border-[#d8d1c3] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589] block mb-1">
            Total Credits / Inflows
          </span>
          <p className="text-2xl font-black text-[#059669]">
            +${totalInflow.toFixed(3)}
          </p>
          <span className="text-[11px] text-[#718589]">From ad views, bonuses & deposits</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589] block mb-1">
            Total Debits / Outflows
          </span>
          <p className="text-2xl font-black text-[#b91c1c]">
            -${totalOutflow.toFixed(2)}
          </p>
          <span className="text-[11px] text-[#718589]">Packages purchased & withdrawals</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e4ded2] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718589] block mb-1">
            Current Wallet Balance
          </span>
          <p className="text-2xl font-black text-[#0c5963]">
            {formatCurrency(userStats?.walletBalance ?? 0)}
          </p>
          <span className="text-[11px] text-[#718589]">Live audited balance</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e4ded2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'ad_reward', label: 'Ad Rewards' },
            { id: 'commission', label: 'Commissions' },
            { id: 'milestone_bonus', label: 'Bonuses' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'package_purchase', label: 'Packages' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#0c5963] text-white border-[#0c5963]'
                  : 'bg-[#faf8f5] text-[#526d72] border-[#e4ded2] hover:bg-[#ede7dc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#718589] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search description..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#faf8f5] border border-[#d8d1c3] rounded-xl text-[#09353e] focus:outline-none focus:border-[#0c5963]"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#e4ded2] shadow-xs overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#718589]">
            <History className="w-8 h-8 mx-auto text-[#a0b0b3] mb-2" />
            No transaction records matched your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#faf8f5] border-b border-[#f0ebe0] text-[#718589] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f1e8]">
                {paginatedTransactions.map((tx) => {
                  const meta = getTypeMeta(tx.type, tx.amount);
                  const isPositive = Number(tx.amount) >= 0;
                  const formattedAmount = `${isPositive ? '+' : '-'}$${Math.abs(Number(tx.amount)).toFixed(3)}`;

                  return (
                    <tr key={tx.id} className="hover:bg-[#faf8f5]/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#526d72] whitespace-nowrap text-[11px]">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${meta.color}`}
                        >
                          <meta.icon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#09353e] font-medium max-w-xs sm:max-w-md truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span className={isPositive ? 'text-[#059669]' : 'text-[#b91c1c]'}>
                          {formattedAmount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[#526d72] text-[11px]">
                        {tx.balanceAfter !== null && tx.balanceAfter !== undefined
                          ? `$${Number(tx.balanceAfter).toFixed(3)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#f0ebe0] flex items-center justify-between text-xs bg-[#faf8f5]">
            <span className="text-[#718589]">
              Page {currentPage} of {totalPages} ({filteredTransactions.length} items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-[#d8d1c3] rounded-lg disabled:opacity-40 cursor-pointer font-bold"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-[#d8d1c3] rounded-lg disabled:opacity-40 cursor-pointer font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
