"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const navItems = [
  { label: "overview", href: "/dashboard", icon: "◈" },
  { label: "sub-accounts", href: "/dashboard/accounts", icon: "⬡" },
  { label: "marketplace", href: "/dashboard/marketplace", icon: "◆" },
  { label: "whitelist", href: "/dashboard/whitelist", icon: "◎" },
  { label: "transactions", href: "/dashboard/transactions", icon: "↻" },
  { label: "guide", href: "/dashboard/guide", icon: "?" },
];

function truncateAddress(addr: string) {
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-[#08090a] border-r border-white/[0.10]">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          mpp vault<span className="text-[var(--accent)]">_</span>
        </Link>
      </div>

      <nav className="flex-1 py-2 px-3">
        <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-medium px-3 mb-3">
          dashboard
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200 mb-0.5 ${
                isActive
                  ? "text-[var(--accent)] bg-[var(--accent)]/[0.08] border-l-2 border-[var(--accent)] font-medium"
                  : "text-neutral-500 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-[14px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/dashboard/accounts/new"
          className="flex items-center justify-center rounded-xl border border-white/[0.08] py-2.5 text-[13px] text-neutral-500 transition-all duration-200 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] hover:bg-[var(--accent)]/[0.04]"
        >
          + new sub-account
        </Link>
      </div>

      <div className="border-t border-white/[0.10] px-6 py-4">
        {connected && publicKey ? (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/[0.15] flex items-center justify-center text-[var(--accent)] text-[11px] font-bold">
              {publicKey.toBase58().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white font-medium truncate">
                {truncateAddress(publicKey.toBase58())}
              </p>
              <button
                onClick={() => disconnect()}
                className="text-[10px] text-neutral-600 hover:text-red-400 transition-colors"
              >
                disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium text-black bg-[var(--accent)] hover:brightness-110 transition"
          >
            connect wallet
          </button>
        )}
      </div>
    </aside>
  );
}
