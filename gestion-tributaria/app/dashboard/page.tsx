import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import ClientTaxSituation from "./_components/client-tax-situation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const dbAdmin = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (dbAdmin) redirect("/dashboard/clientes");

  const dbCliente = await db.cliente.findFirst({
    where: { clerk_id: userId },
    include: {
      liquidacion: { include: { impuesto: true, comprobante: true } },
    },
  });

  if (!dbCliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Cuenta no registrada</h1>
        <p className="text-slate-600 max-w-xl">
          No hay un contribuyente asociado a tu cuenta. Verificá tu CUIL o contactá al estudio.
        </p>
      </div>
    );
  }

  const liquidacionesFormateadas = dbCliente.liquidacion.map((liq) => {
    return {
      id: liq.numero_boleta.toString(),
      impuesto: liq.impuesto?.formato || "Impuesto General",
      periodo: liq.periodo_fiscal // Use liquidacion.periodo_fiscal for the period
        ? new Date(liq.periodo_fiscal).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
        : "Período Actual",
      monto: liq.importe || 0,
      estado: (liq.estado?.toUpperCase() === "PAGADO" ? "PAGADO" : "PENDIENTE") as "PAGADO" | "PENDIENTE", // Ensure type safety
      fechaVencimiento: liq.vencimiento // Use liquidacion.vencimiento for the due date
        ? new Date(liq.vencimiento).toLocaleDateString("es-AR")
        : "Sin fecha",
    };
  });

  return <ClientTaxSituation clienteName={nombreUsuario} liquidaciones={liquidacionesFormateadas} />;
}
