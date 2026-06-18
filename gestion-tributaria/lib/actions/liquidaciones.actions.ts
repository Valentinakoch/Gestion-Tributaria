"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { procesarDatosExtraidos } from "../../lib/pdf-parser";

// Inicializamos el cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export async function crearLiquidacion(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const cuilCliente = formData.get("cuilCliente") as string;
    const idImpuesto = Number(formData.get("idImpuesto"));
    const monto = Number(formData.get("monto"));
    const periodo = formData.get("periodo") as string;
    const vencimiento = formData.get("vencimiento") as string;
    const archivo = formData.get("archivo") as File;

    // 1. Subir archivo a Supabase Storage
    const fileName = `${cuilCliente}/${periodo}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Liquidaciones")
      .upload(fileName, archivo);

    if (uploadError) {
      console.error("Error Supabase Upload:", {
        message: uploadError.message,
        error: uploadError,
        fileName,
        archivoName: archivo.name,
      });
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    // 2. Obtener la URL pública del documento
    const { data: { publicUrl } } = supabase.storage.from("Liquidaciones").getPublicUrl(fileName);

    const [anio, mes] = periodo.split("-").map(Number);
    const periodoDate = new Date(anio, mes - 1, 15);
    const vencimientoDate = new Date(vencimiento);

    // 3. Crear el registro en Prisma utilizando BigInt para el CUIL
    await db.liquidacion.create({
      data: {
        periodo_fiscal: periodoDate,
        vencimiento: vencimientoDate,
        importe: monto,
        estado: "PENDIENTE",
        cuil_cliente: BigInt(cuilCliente),
        id_impuesto: idImpuesto,
        url_archivo: publicUrl, 
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error al crear la liquidación:", error);
    return { error: error.message || "Error al crear la liquidación." };
  }
}


export async function subirComprobantePago(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  const liquidacionId = Number(formData.get("liquidacionId"));
  const archivo = formData.get("archivo") as File;
  const textoPDF = formData.get("textoPDF") as string;

  if (isNaN(liquidacionId) || !archivo) {
    return { error: "Faltan datos obligatorios (ID de liquidación o archivo)." };
  }

  if (archivo.type !== "application/pdf") {
    return { error: "El archivo debe ser un PDF válido." };
  }

  try {
    const liquidacion = await db.liquidacion.findUnique({
      where: { numero_boleta: liquidacionId },
      include: { cliente: true },
    });

    if (!liquidacion) {
      return { error: "Liquidación no encontrada." };
    }
    if (liquidacion.estado?.toUpperCase() === "PAGADO") {
      return { error: "Esta liquidación ya está marcada como pagada." };
    }

    if (!textoPDF) {
      return { error: "No se recibió el texto extraído del comprobante." };
    }

    // Pasamos el monto original de la liquidación como guía para discriminar subtotales o descuentos
    const montoLiquidacion = liquidacion.importe || 0;
    const datosDelPDF = procesarDatosExtraidos(textoPDF, montoLiquidacion);

    if (!datosDelPDF.monto) {
      return { error: "No se pudo extraer un monto válido del PDF del comprobante." };
    }

    // Comparar el monto inteligente extraído con el monto esperado
    const diferenciaMonto = Math.abs(datosDelPDF.monto - montoLiquidacion);

    if (diferenciaMonto > 0.01) { 
      return { 
        error: `El monto del comprobante ($${datosDelPDF.monto.toLocaleString('es-AR')}) no coincide con el monto de la liquidación ($${montoLiquidacion.toLocaleString('es-AR')}).` 
      };
    }

    // Subir comprobante físico a Supabase Storage
    const fileName = `comprobantes/${liquidacion.cuil_cliente}/${liquidacion.numero_boleta}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Comprobantes")
      .upload(fileName, archivo, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Error Supabase Upload (Comprobante):", uploadError);
      throw new Error(`Error al subir el archivo del comprobante: ${uploadError.message}`);
    }

    // Obtener la URL pública del comprobante guardado
    const { data: { publicUrl } } = supabase.storage.from("Comprobantes").getPublicUrl(fileName);

    await db.$transaction(async (prisma) => {
  const comprobante = await prisma.comprobante.create({
    data: {
      periodo_fiscal: liquidacion.periodo_fiscal, 
      importe: datosDelPDF.monto!,
      url_archivo: publicUrl,
    },
  });

  
  await prisma.liquidacion.update({
    where: { numero_boleta: liquidacionId },
    data: {
      estado: "PAGADO",
      numero_boleta_comprobante: comprobante.numero_boleta,
    },
  });
});

    // Revalidar los paths clave para refrescar la interfaz del usuario al instante
    revalidatePath(`/dashboard/liquidaciones/${liquidacionId}`);
    revalidatePath("/dashboard/liquidaciones");
    revalidatePath("/dashboard"); 

    return { success: true, message: "Comprobante subido y liquidación marcada como pagada." };

  } catch (error: any) {
    console.error("Error al subir comprobante de pago:", error);
    return { error: error.message || "Error al procesar el comprobante de pago." };
  }
}