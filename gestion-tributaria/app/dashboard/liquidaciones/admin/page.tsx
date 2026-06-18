import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../../lib/prisma";
import { FileText } from "lucide-react";
import LiquidacionesList from "../_components/liquidaciones-list";

export default async function LiquidacionesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) redirect("/dashboard");

  const liquidaciones = await db.liquidacion.findMany({
    include: {
      cliente: { select: { nombre: true, apellido: true } },
      impuesto: { select: { formato: true } },
    },
    orderBy: { periodo_fiscal: "desc" },
  });

  const data = liquidaciones.map((l) => ({
    numeroBoleta: l.numero_boleta,
    cliente:
      [l.cliente?.nombre, l.cliente?.apellido]
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
