"use client";

import Header from "@/components/Header";

const packs = [
  { name: "10 Credits", price: "$4.99", credits: "10", period: "1 year", popular: false },
  { name: "30 Credits", price: "$12.99", credits: "30", period: "1 year", popular: false },
  { name: "80 Credits", price: "$29.99", credits: "80", period: "1 year", popular: true },
];

const monthly = [
  { name: "Basic", price: "$9.99/mo", credits: "25", period: "30 days", popular: false },
  { name: "Pro", price: "$19.99/mo", credits: "60", period: "30 days", popular: true },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
            Choose Your Plan
          </h1>
          <p className="text-gray-500 text-center mt-3">
            Get more API credits for faster, higher-quality background removal
          </p>

          {/* Credit Packs */}
          <h2 className="text-xl font-semibold text-gray-900 mt-12 mb-4">Credit Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 text-center ${
                  plan.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
                <p className="text-gray-500 text-sm mt-1">{plan.period} validity</p>
                <p className="text-gray-700 font-medium mt-4">{plan.credits} API credits</p>
                <button className={`mt-6 w-full py-2.5 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                  Buy Now
                </button>
              </div>
            ))}
          </div>

          {/* Monthly Plans */}
          <h2 className="text-xl font-semibold text-gray-900 mt-12 mb-4">Monthly Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {monthly.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 text-center ${
                  plan.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
                    Best Value
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
                <p className="text-gray-500 text-sm mt-1">{plan.period} validity</p>
                <p className="text-gray-700 font-medium mt-4">{plan.credits} API credits/month</p>
                <button className={`mt-6 w-full py-2.5 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">&copy; 2026 BGFree</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 text-sm no-underline">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 text-sm no-underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
