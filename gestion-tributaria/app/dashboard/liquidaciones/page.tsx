import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import { FileText } from "lucide-react";
import LiquidacionesList from "./_components/liquidaciones-list";

export default async function LiquidacionesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
  if (!clerkUser?.cuil || !clerkUser?.rol) redirect("/dashboard");

  const cuilNumber = BigInt(clerkUser.cuil.replace(/\D/g, ""));
  const dbAdmin = await db.contador.findUnique({ where: { cuil: cuilNumber } });
  if (!dbAdmin) redirect("/dashboard");

  const liquidaciones = await db.liquidacion.findMany({
    include: {
      cliente: {
        include: { usuario: { select: { nombre_usuario: true, apellido_usuario: true } } },
      },
      impuesto: { select: { formato: true } },
    },
    orderBy: { periodo_fiscal: "desc" },
  });

  const data = liquidaciones.map((l) => ({
    numeroBoleta: l.numero_boleta,
    cliente:
      [l.cliente?.usuario?.nombre_usuario, l.cliente?.usuario?.apellido_usuario]
        .filter(Boolean)
        .join(" ") || `CUIL: ${l.cuil_cliente}`,
    impuesto: l.impuesto?.formato || "—",
    periodo: l.periodo_fiscal
      ? new Date(l.periodo_fiscal).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
      : "—",
    monto: l.importe || 0,
    estado: (l.estado?.toUpperCase() === "PAGADO" ? "PAGADO" : "PENDIENTE") as "PAGADO" | "PENDIENTE",
  }));

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listado Liquidaciones</h1>
          <p className="text-sm text-slate-500">Historial de comprobantes</p>
        </div>
      </header>

      <LiquidacionesList liquidaciones={data} />
    </div>
  );
}
