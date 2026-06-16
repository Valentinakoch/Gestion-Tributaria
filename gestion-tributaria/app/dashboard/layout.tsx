import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import Sidebar from "@/components/sidebar";
import CuilSetup from "@/components/cuil-setup";

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
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar userName={nombreUsuario} userRole={userRole} />
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
