interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-5 transition-all duration-200 ${
      accent
        ? "bg-gradient-to-br from-[var(--accent)]/[0.10] to-transparent border border-[var(--accent)]/[0.15]"
        : "liquid-glass"
    }`}>
      <p className="text-[10px] text-neutral-400 uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 text-[26px] num font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-neutral-500">{sub}</p>}
    </div>
  );
}
