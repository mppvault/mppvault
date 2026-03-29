import Sidebar from "@/components/dashboard/Sidebar";
import WalletProvider from "@/components/WalletProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <div className="flex min-h-screen bg-[#08090a] text-white">
        <Sidebar />
        <main className="flex-1 pl-60">
          <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
        </main>
      </div>
    </WalletProvider>
  );
}
