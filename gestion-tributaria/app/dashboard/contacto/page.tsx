import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import { Mail } from "lucide-react";
import ContactForm from "./contact-form";

export default async function ContactoPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
  if (!clerkUser?.cuil || !clerkUser?.rol) redirect("/dashboard");

  const cuilNumber = BigInt(clerkUser.cuil.replace(/\D/g, ""));
  const dbAdmin = await db.administrador.findUnique({ where: { cuil: cuilNumber } });
  if (dbAdmin) redirect("/dashboard");

  const dbUsuario = await db.usuario.findUnique({ where: { CUIL_usuario: cuilNumber } });

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacto</h1>
          <p className="text-sm text-slate-500">Comunicate con el estudio, {nombreUsuario}</p>
        </div>
      </header>

      <ContactForm
        email={dbUsuario?.email || ""}
        telefono={dbUsuario?.telefono || ""}
      />
    </div>
  );
}
