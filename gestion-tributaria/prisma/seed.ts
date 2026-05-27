import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function insertUsuario(
  cuil: string,
  nombre: string | null,
  apellido: string | null,
  email: string | null,
  telefono: string | null,
) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "usuario" ("CUIL_usuario", "nombre_usuario", "apellido_usuario", "email", "telefono")
     VALUES ($1, $2, $3, $4, $5)`,
    BigInt(cuil),
    nombre,
    apellido,
    email,
    telefono,
  );
}

async function main() {
  console.log("Limpiando datos existentes...");

  await prisma.turno.deleteMany();
  await prisma.inscripto_en.deleteMany();
  await prisma.liquidacion.deleteMany();
  await prisma.comprobante.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.administrador.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.impuesto.deleteMany();
  await prisma.entidad_tributaria.deleteMany();
  await prisma.estudio_contable.deleteMany();

  console.log("Creando estudio contable...");
  const estudio = await prisma.estudio_contable.create({ data: {} });

  console.log("Creando usuario administrador...");
  await insertUsuario("12345678910", "Tomás", "Gadea", "tomasgadea2003@hotmail.com", null);

  await prisma.administrador.create({
    data: { cuil: BigInt("12345678910"), id_estudio: estudio.id_estudio },
  });

  console.log("Creando entidades tributarias...");
  const afip = await prisma.entidad_tributaria.create({ data: { nombre: "AFIP", url: "https://www.afip.gob.ar" } });
  const arba = await prisma.entidad_tributaria.create({ data: { nombre: "ARBA", url: "https://www.arba.gov.ar" } });
  const agip = await prisma.entidad_tributaria.create({ data: { nombre: "AGIP", url: "https://www.agip.gob.ar" } });
  const dgi = await prisma.entidad_tributaria.create({ data: { nombre: "DGI", url: "https://www.dgi.gub.uy" } });

  const entidadPorNombre: Record<string, number> = {
    AFIP: afip.id_entidad,
    ARBA: arba.id_entidad,
    AGIP: agip.id_entidad,
    DGI: dgi.id_entidad,
  };

  console.log("Creando impuestos...");
  const iva = await prisma.impuesto.create({ data: { formato: "IVA" } });
  const ganancias = await prisma.impuesto.create({ data: { formato: "Ganancias" } });
  const ingresosBrutos = await prisma.impuesto.create({ data: { formato: "Ingresos Brutos" } });
  const bienesPersonales = await prisma.impuesto.create({ data: { formato: "Bienes Personales" } });
  const monotributo = await prisma.impuesto.create({ data: { formato: "Monotributo" } });

  const impuestoPorNombre: Record<string, number> = {
    IVA: iva.id_impuesto,
    Ganancias: ganancias.id_impuesto,
    "Ingresos Brutos": ingresosBrutos.id_impuesto,
    "Bienes Personales": bienesPersonales.id_impuesto,
    Monotributo: monotributo.id_impuesto,
  };

  console.log("Creando clientes...");
  const clientesData = [
    { cuil: "20123456781", nombre: "Carlos", apellido: "López", email: "carlos.lopez@email.com", telefono: "1123456781" },
    { cuil: "20234567892", nombre: "María", apellido: "García", email: "maria.garcia@email.com", telefono: "1123456792" },
    { cuil: "20345678903", nombre: "Juan", apellido: "Pérez", email: "juan.perez@email.com", telefono: "1145678903" },
    { cuil: "20456789014", nombre: "Ana", apellido: "Martínez", email: "ana.martinez@email.com", telefono: "1156789014" },
    { cuil: "20567890125", nombre: "Pedro", apellido: "Rodríguez", email: "pedro.rodriguez@email.com", telefono: "1167890125" },
    { cuil: "20678901236", nombre: "Laura", apellido: "Fernández", email: "laura.fernandez@email.com", telefono: "1178901236" },
    { cuil: "20789012347", nombre: "Diego", apellido: "González", email: "diego.gonzalez@email.com", telefono: "1189012347" },
    { cuil: "20890123458", nombre: "Sofía", apellido: "Díaz", email: "sofia.diaz@email.com", telefono: "1190123458" },
  ];

  for (const c of clientesData) {
    await insertUsuario(c.cuil, c.nombre, c.apellido, c.email, c.telefono);
    await prisma.cliente.create({
      data: { cuil: BigInt(c.cuil), id_estudio: estudio.id_estudio },
    });
  }

  console.log("Creando liquidaciones y comprobantes...");
  const liquidacionesData = [
    { cuil: "20123456781", impuesto: "IVA", mes: 0, importe: 15000.50, estado: "PAGADO" },
    { cuil: "20123456781", impuesto: "Ganancias", mes: 1, importe: 22300.00, estado: "PENDIENTE" },
    { cuil: "20234567892", impuesto: "IVA", mes: 2, importe: 18750.75, estado: "PAGADO" },
    { cuil: "20234567892", impuesto: "Ingresos Brutos", mes: 3, importe: 31200.00, estado: "PENDIENTE" },
    { cuil: "20345678903", impuesto: "IVA", mes: 4, importe: 9800.25, estado: "PAGADO" },
    { cuil: "20345678903", impuesto: "Bienes Personales", mes: 5, importe: 45000.00, estado: "PENDIENTE" },
    { cuil: "20456789014", impuesto: "Ganancias", mes: 6, importe: 12450.00, estado: "PAGADO" },
    { cuil: "20456789014", impuesto: "Monotributo", mes: 7, importe: 27600.00, estado: "PENDIENTE" },
    { cuil: "20567890125", impuesto: "IVA", mes: 8, importe: 19200.50, estado: "PAGADO" },
    { cuil: "20567890125", impuesto: "Ingresos Brutos", mes: 9, importe: 35000.00, estado: "PENDIENTE" },
    { cuil: "20678901236", impuesto: "Bienes Personales", mes: 10, importe: 8700.00, estado: "PAGADO" },
    { cuil: "20678901236", impuesto: "IVA", mes: 11, importe: 52000.00, estado: "PENDIENTE" },
    { cuil: "20789012347", impuesto: "Ganancias", mes: 0, importe: 8000.00, estado: "PENDIENTE" },
    { cuil: "20789012347", impuesto: "Monotributo", mes: 2, importe: 11000.00, estado: "PAGADO" },
    { cuil: "20890123458", impuesto: "IVA", mes: 4, importe: 16500.00, estado: "PENDIENTE" },
  ];

  for (const liq of liquidacionesData) {
    let idComprobante: number | undefined;
    if (liq.estado === "PAGADO") {
      const comprobante = await prisma.comprobante.create({
        data: { periodo_fiscal: new Date(2024, liq.mes, 15), importe: liq.importe },
      });
      idComprobante = comprobante.numero_boleta;
    }
    await prisma.liquidacion.create({
      data: {
        periodo_fiscal: new Date(2024, liq.mes, 15),
        importe: liq.importe,
        estado: liq.estado,
        cuil_cliente: BigInt(liq.cuil),
        id_impuesto: impuestoPorNombre[liq.impuesto],
        numero_boleta_comprobante: idComprobante,
      },
    });
  }

  console.log("Creando inscripciones...");
  const inscriptosData = [
    { cuil: "20123456781", entidad: "AFIP", clave: "afip-20123456781" },
    { cuil: "20123456781", entidad: "ARBA", clave: "arba-20123456781" },
    { cuil: "20234567892", entidad: "AFIP", clave: "afip-20234567892" },
    { cuil: "20234567892", entidad: "AGIP", clave: "agip-20234567892" },
    { cuil: "20345678903", entidad: "AFIP", clave: "afip-20345678903" },
    { cuil: "20456789014", entidad: "ARBA", clave: "arba-20456789014" },
    { cuil: "20567890125", entidad: "AFIP", clave: "afip-20567890125" },
    { cuil: "20567890125", entidad: "DGI", clave: "dgi-20567890125" },
    { cuil: "20678901236", entidad: "AFIP", clave: "afip-20678901236" },
    { cuil: "20789012347", entidad: "AGIP", clave: "agip-20789012347" },
    { cuil: "20890123458", entidad: "AFIP", clave: "afip-20890123458" },
    { cuil: "20890123458", entidad: "ARBA", clave: "arba-20890123458" },
  ];

  for (const ins of inscriptosData) {
    await prisma.inscripto_en.create({
      data: {
        cuil_cliente: BigInt(ins.cuil),
        id_entidad: entidadPorNombre[ins.entidad],
        clave: ins.clave,
      },
    });
  }

  console.log("Creando turnos...");
  const turnosData = [
    { cuil: "20123456781", fecha: new Date("2025-02-10"), hora: "10:00:00" },
    { cuil: "20234567892", fecha: new Date("2025-02-11"), hora: "14:30:00" },
    { cuil: "20345678903", fecha: new Date("2025-02-12"), hora: "09:00:00" },
    { cuil: "20567890125", fecha: new Date("2025-02-13"), hora: "11:00:00" },
    { cuil: "20678901236", fecha: new Date("2025-02-14"), hora: "16:00:00" },
  ];

  for (const t of turnosData) {
    const [h, m, s] = t.hora.split(":").map(Number);
    const horaDate = new Date();
    horaDate.setHours(h, m, s, 0);
    await prisma.turno.create({
      data: {
        cuil_cliente: BigInt(t.cuil),
        cuil_admin: BigInt("12345678910"),
        fecha: t.fecha,
        hora: horaDate,
      },
    });
  }

  console.log("");
  console.log("Seed completado exitosamente!");
  console.log("- Admin creado: Tomas Gadea (CUIL: 12345678910)");
  console.log("- 8 clientes creados");
  console.log("- 4 entidades tributarias");
  console.log("- 5 impuestos");
  console.log("- 15 liquidaciones");
  console.log("- 7 comprobantes");
  console.log("- 12 inscripciones");
  console.log("- 5 turnos");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
