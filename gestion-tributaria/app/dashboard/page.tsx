import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import AdminClientList from "./_components/admin-client-list";
import ClientTaxSituation from "./_components/client-tax-situation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const dbAdmin = await db.contador.findFirst({ where: { clerk_id: userId } });

  if (dbAdmin) {
    const clientes = await db.cliente.findMany({
      where: { id_estudio: dbAdmin.id_estudio },
      select: {
        cuil: true,
        nombre: true,
        apellido: true,
        liquidacion: { select: { estado: true } },
      },
    });

    const clientesData = clientes.map((c) => ({
      id: c.cuil.toString(),
      nombre: [c.nombre, c.apellido].filter(Boolean).join(" ") || `Cliente CUIL: ${c.cuil}`,
      cuit: c.cuil.toString(),
      estado: (c.liquidacion.some((l) => l.estado?.toUpperCase() === "PENDIENTE")
        ? "pendiente"
        : "al_dia") as "pendiente" | "al_dia",
    }));

    return <AdminClientList adminName={nombreUsuario} clientesData={clientesData} />;
  }

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
    const fechaReferencia = liq.periodo_fiscal || liq.comprobante?.periodo_fiscal;
    return {
      id: liq.numero_boleta.toString(),
      impuesto: liq.impuesto?.formato || "Impuesto General",
      periodo: liq.periodo_fiscal
        ? new Date(liq.periodo_fiscal).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
        : "Período Actual",
      monto: liq.importe || 0,
      estado: (liq.estado?.toUpperCase() === "PAGADO" ? "PAGADO" : "PENDIENTE") as "PAGADO" | "PENDIENTE",
      fechaVencimiento: fechaReferencia
        ? new Date(fechaReferencia).toLocaleDateString("es-AR")
        : "Sin fecha",
    };
  });

  return <ClientTaxSituation clienteName={nombreUsuario} liquidaciones={liquidacionesFormateadas} />;
}
