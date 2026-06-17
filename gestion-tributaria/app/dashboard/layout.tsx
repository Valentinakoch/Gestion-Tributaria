import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "../../lib/prisma";
import Sidebar from "@/components/sidebar";
import CuilSetup from "@/components/cuil-setup";
import UserHeader from "@/components/user-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });

  if (!contador && !cliente) {
    return <CuilSetup userName={nombreUsuario} />;
  }

  const userRole: "ADMIN" | "CLIENTE" = contador ? "ADMIN" : "CLIENTE";

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="flex-none bg-white border-b border-slate-200 flex items-center justify-between px-6 py-4 z-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-dark flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <polyline
                points="6,24 12,16 20,20 26,10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="10" r="2.5" fill="#C8D9EE" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-brand-dark">ESTUDIO</span>
        </Link>
        <UserHeader userName={nombreUsuario} userRole={userRole.toLowerCase()} />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
