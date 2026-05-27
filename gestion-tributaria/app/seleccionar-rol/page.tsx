import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import RoleSelector from "./role-selector";

export default async function SeleccionarRolPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
  if (!clerkUser?.cuil) redirect("/dashboard");

  if (clerkUser.rol) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-dark to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Bienvenido, {nombreUsuario}
          </h1>
          <p className="text-slate-300 text-lg">
            Seleccioná el tipo de cuenta con la que querés ingresar
          </p>
        </div>

        <RoleSelector />
      </div>
    </div>
  );
}
