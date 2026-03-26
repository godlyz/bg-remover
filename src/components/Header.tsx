"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { user, loading, signin, signout } = useAuth();

  return (
    <header className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">BGFree</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Pricing
          </Link>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="text-sm text-gray-700 hidden sm:inline">{user.name}</span>
              <button
                onClick={signout}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signin}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
