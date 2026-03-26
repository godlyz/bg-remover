"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Header from "@/components/Header";
import { ToastProvider, useToast } from "@/components/Toast";

interface CreditPack {
  id: number;
  total_credits: number;
  remaining_credits: number;
  type: string;
  expires_at: string | null;
}

interface Transaction {
  id: number;
  product_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

function AccountContent() {
  const { user, loading: authLoading, signout } = useAuth();
  const { showToast } = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/credits/balance").then(r => r.json()),
      fetch("/api/account/transactions").then(r => r.json()).catch(() => ({ transactions: [] })),
    ]).then(([creditData, txnData]) => {
      setBalance(creditData.balance ?? 0);
      setPacks(creditData.packs ?? []);
      setTransactions(txnData.transactions ?? []);
    }).catch(() => {
      showToast("error", "Failed to load account data");
    }).finally(() => {
      setLoading(false);
    });
  }, [user, showToast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Sign in required</h2>
            <p className="text-gray-500 mt-2 text-sm">Please sign in to view your account and credits.</p>
            <button
              onClick={() => { window.location.href = "/api/auth/signin/google"; }}
              className="mt-6 w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              Sign in with Google
            </button>
          </div>
        </main>
      </div>
    );
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case "bonus": return "🎁 Welcome Bonus";
      case "pack_10": return "Credit Pack · 10";
      case "pack_30": return "Credit Pack · 30";
      case "pack_80": return "Credit Pack · 80";
      case "monthly_25": return "Monthly · 25";
      case "monthly_60": return "Monthly · 60";
      default: return type;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Completed</span>;
      case "pending": return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Pending</span>;
      case "failed": return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Failed</span>;
      default: return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never expires";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              <button
                onClick={signout}
                className="text-gray-400 hover:text-red-500 text-sm transition px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Credit Balance */}
          <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm">
            <p className="text-blue-100 text-sm">Available Credits</p>
            <p className="text-4xl font-bold mt-1">{balance ?? 0}</p>
            <div className="mt-3">
              <a
                href="/pricing"
                className="inline-block bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg transition backdrop-blur-sm"
              >
                Purchase Credits →
              </a>
            </div>
          </div>

          {/* Credit Packs */}
          {packs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Credit Packs</h3>
              <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                {packs.map((pack) => (
                  <div key={pack.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{typeLabel(pack.type)}</p>
                      <p className="text-gray-500 text-sm">
                        {pack.remaining_credits} / {pack.total_credits} credits remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(pack.expires_at)}</p>
                      {/* Progress bar */}
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(pack.remaining_credits / pack.total_credits) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          {transactions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h3>
              <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                {transactions.map((txn) => (
                  <div key={txn.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{typeLabel(txn.product_type)}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(txn.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        ${txn.amount.toFixed(2)}
                      </span>
                      {statusBadge(txn.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {packs.length === 0 && transactions.length === 0 && (
            <div className="mt-6 bg-white rounded-2xl p-8 shadow-sm text-center">
              <p className="text-gray-400">No credit packs yet.</p>
              <a href="/pricing" className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block">
                Purchase your first credit pack →
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">&copy; 2026 BGFree</p>
        </div>
      </footer>
    </div>
  );
}

export default function Account() {
  return (
    <ToastProvider>
      <AccountContent />
    </ToastProvider>
  );
}
