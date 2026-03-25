"use client";

import { useState } from "react";

interface HeaderProps {
  user?: { name: string; email: string } | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BG</span>
          </div>
          <span className="text-xl font-bold text-gray-900">BGFree</span>
        </a>

        <nav className="flex items-center gap-4">
          <a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium no-underline">
            Pricing
          </a>
          {user ? (
            <div className="flex items-center gap-3">
              <a href="/account" className="text-gray-600 hover:text-gray-900 text-sm font-medium no-underline">
                Account
              </a>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                {user.name || "Account"}
              </button>
            </div>
          ) : (
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
