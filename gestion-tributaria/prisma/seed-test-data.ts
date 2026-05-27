import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("La variable DATABASE_URL no está definida.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

async function main() {
  const cuil = "20901234569";
  const cuilNum = BigInt(cuil);
  const adminCuil = BigInt("12345678910");

  // 1. Asegurar que usuario, cliente, clerk_user existen
  const clienteExistente = await prisma.cliente.findUnique({ where: { cuil: cuilNum } });
  if (!clienteExistente) {
    await prisma.usuario.create({
      data: {
        CUIL_usuario: cuilNum,
        nombre_usuario: "cliente",
        apellido_usuario: null,
        email: "cliente@example.com",
        telefono: null,
      },
    });
    await prisma.cliente.create({
      data: { cuil: cuilNum, id_estudio: 3 },
    });
    console.log("usuario + cliente creados.");
  }

  await prisma.clerk_user.upsert({
    where: { id: "user_3EJJaBVKdlCqD40E4PglLpJyUPR" },
    create: { id: "user_3EJJaBVKdlCqD40E4PglLpJyUPR", email: "cliente@example.com", firstName: "cliente", cuil, rol: "cliente" },
    update: { cuil, rol: "cliente" },
  });

  // 2. Inscripto en AFIP y ARBA
  const entidades = [5, 6];
  for (const idEntidad of entidades) {
    const exists = await prisma.inscripto_en.findUnique({
      where: { cuil_cliente_id_entidad: { cuil_cliente: cuilNum, id_entidad: idEntidad } },
    });
    if (!exists) {
      await prisma.inscripto_en.create({
        data: { cuil_cliente: cuilNum, id_entidad: idEntidad, clave: "30-12345678-9" },
      });
      console.log("inscripto_en id_entidad:", idEntidad);
    }
  }

  // 3. Liquidaciones + comprobantes
  const liquidaciones = [
    { impuesto: 6, periodo: new Date(2025, 4, 15), importe: 15000, estado: "PENDIENTE", mes: "Mayo 2025" },
    { impuesto: 7, periodo: new Date(2025, 3, 15), importe: 45000, estado: "PENDIENTE", mes: "Abril 2025" },
    { impuesto: 8, periodo: new Date(2025, 5, 15), importe: 8500, estado: "PAGADO", mes: "Junio 2025" },
    { impuesto: 10, periodo: new Date(2025, 0, 15), importe: 32000, estado: "PAGADO", mes: "Enero 2025" },
  ];

  for (const liq of liquidaciones) {
    const exists = await prisma.liquidacion.findFirst({
      where: { cuil_cliente: cuilNum, id_impuesto: liq.impuesto, periodo_fiscal: liq.periodo },
    });
    if (exists) {
      console.log("liquidacion ya existe:", liq.mes);
      continue;
    }

    let comprobanteId: number | undefined;
    if (liq.estado === "PAGADO") {
      const comp = await prisma.comprobante.create({
        data: { periodo_fiscal: liq.periodo, importe: liq.importe },
      });
      comprobanteId = comp.numero_boleta;
    }

    await prisma.liquidacion.create({
      data: {
        periodo_fiscal: liq.periodo,
        importe: liq.importe,
        estado: liq.estado,
        cuil_cliente: cuilNum,
        id_impuesto: liq.impuesto,
        numero_boleta_comprobante: comprobanteId ?? null,
      },
    });
    console.log("liquidacion:", liq.mes, liq.estado);
  }

  // 4. Turno
  const turnoFecha = new Date(2025, 5, 15);
  const turnoHora = new Date();
  turnoHora.setHours(10, 0, 0, 0);

  const turnoExists = await prisma.turno.findUnique({
    where: {
      fecha_hora_cuil_admin_cuil_cliente: {
        fecha: turnoFecha,
        hora: turnoHora,
        cuil_admin: adminCuil,
        cuil_cliente: cuilNum,
      },
    },
  });

  if (!turnoExists) {
    await prisma.turno.create({
      data: {
        cuil_cliente: cuilNum,
        cuil_admin: adminCuil,
        fecha: turnoFecha,
        hora: turnoHora,
      },
    });
    console.log("turno: 15/06/2025 10:00");
  }

  console.log("Todos los datos de prueba creados correctamente.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
