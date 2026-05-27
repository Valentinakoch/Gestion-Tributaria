import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import Sidebar from "@/components/sidebar";
import CuilSetup from "@/components/cuil-setup";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  if (!userEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Cuenta incompleta</h1>
        <p className="text-slate-600 max-w-xl">
          No se pudo obtener el correo electrónico de tu sesión de Clerk. Por favor revisá tu cuenta o contactá al administrador.
        </p>
      </div>
    );
  }

  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  let clerkUser: { cuil: string | null; rol: string | null };
  try {
    clerkUser = await db.clerk_user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: userEmail,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      },
      update: {
        email: userEmail,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      },
    });
  } catch (e) {
    console.error("Error en upsert clerk_user:", e);
    throw new Error(`Error al sincronizar usuario: ${e instanceof Error ? e.message : "desconocido"}`);
  }

  const userCuil = typeof clerkUser.cuil === "string" ? clerkUser.cuil.replace(/\D/g, "") : undefined;
  if (!userCuil || !/^\d{11}$/.test(userCuil)) {
    return <CuilSetup userName={nombreUsuario} />;
  }

  if (!clerkUser.rol) {
    redirect("/seleccionar-rol");
  }

  const userCuilNumber = BigInt(userCuil);
  let userRole: "ADMIN" | "CLIENTE";

  try {
    const dbAdmin = await db.administrador.findUnique({
      where: { cuil: userCuilNumber },
    });
    userRole = dbAdmin ? "ADMIN" : "CLIENTE";
  } catch (e) {
    console.error("Error al verificar administrador:", e);
    throw new Error(`Error al verificar el usuario: ${e instanceof Error ? e.message : "desconocido"}`);
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar userName={nombreUsuario} userRole={userRole} />
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
