"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "features", href: "/features" },
  { label: "registry", href: "/registry" },
  { label: "roadmap", href: "/roadmap" },
  { label: "docs", href: "/docs" },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? "max-w-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl rounded-full px-2 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "max-w-6xl px-6 py-0"
        }`}
      >
        <Link
          href="/"
          className={`font-semibold tracking-tight transition-all duration-500 ${
            scrolled ? "text-[13px] pl-4" : "text-[15px]"
          }`}
        >
          mpp vault<span className="text-[var(--accent)]">_</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`rounded-full transition-all duration-300 text-neutral-500 hover:text-white hover:bg-white/[0.06] ${
                scrolled ? "px-3 py-1.5 text-[12px]" : "px-3 py-1.5 text-[13px]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://x.com/MPPVault"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-full transition-all duration-300 text-neutral-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center ${
              scrolled ? "w-7 h-7" : "w-8 h-8"
            }`}
          >
            <XIcon className="w-3.5 h-3.5" />
          </a>
        </div>

        <Link
          href="/dashboard"
          className={`relative inline-flex items-center gap-1.5 font-semibold text-black bg-[var(--accent)] rounded-full transition-all duration-500 overflow-hidden group ${
            scrolled ? "px-4 py-1.5 text-[12px]" : "px-5 py-2 text-[13px]"
          }`}
        >
          <span className="relative z-10">launch app</span>
          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </Link>
      </div>
    </header>
  );
}
