"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Procesar datos extraídos del PDF
function procesarDatosExtraidos(textoPDF: string): { monto?: number; nombre?: string } {
  try {
    if (!textoPDF || textoPDF.trim().length === 0) {
      console.warn("Texto del PDF vacío");
      return {};
    }

    // Buscar monto (formato: número con comas/puntos, puede tener $ delante)
    // Busca patrones como: $1.234,56 o 1234.56 o 1,234.56
    const montoRegex = /(?:\$|Total|Monto|Importe|Valor)[:\s]*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi;
    const montos = Array.from(textoPDF.matchAll(montoRegex));
    
    let monto: number | undefined;
    if (montos.length > 0) {
      // Tomar el primer monto encontrado
      const montoStr = montos[0][1].replace(/\./g, "").replace(",", ".");
      monto = parseFloat(montoStr);
      if (isNaN(monto) || monto <= 0) {
        monto = undefined;
      }
    }

    // Si no encontró con palabras clave, buscar cualquier número grande
    if (!monto) {
      const allNumbers = textoPDF.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g) || [];
      for (const numStr of allNumbers) {
        const num = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
        if (num > 100 && !isNaN(num)) {
          monto = num;
          break;
        }
      }
    }

    // Buscar nombre (después de palabras clave como Nombre, Cliente, etc.)
    const nombreRegex = /(?:Nombre|A nombre de|Cliente|Contribuyente|Declarante|Razón Social)[:\s]*([A-ZÁÉÍÓÚa-záéíóúñ\s]+?)(?:[,\n]|Domicilio|CUIL|DNI|Dirección)/i;
    const matchNombre = textoPDF.match(nombreRegex);
    const nombre = matchNombre ? matchNombre[1].trim() : undefined;

    console.log("Datos extraídos - Monto:", monto, "Nombre:", nombre);

    return { monto, nombre };
  } catch (error) {
    console.error("Error procesando datos del PDF:", error);
    return {};
  }
}

// Validar datos del archivo PDF antes de crear la liquidación
export async function validarLiquidacion(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const cuilCliente = formData.get("cuilCliente") as string;
    const idImpuesto = Number(formData.get("idImpuesto"));
    const monto = Number(formData.get("monto"));
    const periodo = formData.get("periodo") as string;
    const vencimiento = formData.get("vencimiento") as string;
    const archivo = formData.get("archivo") as File;
    const textoPDF = formData.get("textoPDF") as string; // Texto extraído del PDF en el cliente

    // Validaciones básicas
    if (!cuilCliente || !idImpuesto || !monto || !periodo || !vencimiento || !archivo) {
      return { error: "Faltan datos obligatorios." };
    }

    if (archivo.type !== "application/pdf") {
      return { error: "El archivo debe ser un PDF válido." };
    }

    if (monto <= 0) {
      return { error: "El monto debe ser mayor a cero." };
    }

    // Procesar datos extraídos del PDF (enviados desde el cliente)
    const datosDelPDF = textoPDF ? procesarDatosExtraidos(textoPDF) : {};
    
    console.log("Validando liquidación:", {
      cuilCliente,
      monto,
      periodo,
      textoPDFLength: textoPDF?.length || 0,
      datosExtraidos: datosDelPDF,
    });

    // Obtener nombre del cliente
    const cliente = await db.cliente.findUnique({
      where: { cuil: BigInt(cuilCliente) },
      select: { nombre: true }
    });

    // Obtener nombre del impuesto
    const impuesto = await db.impuesto.findUnique({
      where: { id_impuesto: idImpuesto },
      select: { formato: true }
    });

    // Comparar montos
    const diferenciaMonto = datosDelPDF.monto ? Math.abs(datosDelPDF.monto - monto) > 0.01 : false;

    // Comparar nombres (simplificado: verificar si el nombre del cliente está en el nombre del PDF)
    const nombreClienteLower = cliente?.nombre?.toLowerCase() || "";
    const nombrePDFLower = datosDelPDF.nombre?.toLowerCase() || "";
    const coincideNombre = nombreClienteLower && nombrePDFLower ? nombreClienteLower.includes(nombrePDFLower) || nombrePDFLower.includes(nombreClienteLower) : true;

    return {
      success: true,
      validacion: {
        cuilCliente,
        nombreCliente: cliente?.nombre || "Cliente desconocido",
        idImpuesto,
        tipoImpuesto: impuesto?.formato || "Impuesto desconocido",
        monto,
        periodo,
        vencimiento: new Date(vencimiento).toLocaleDateString("es-AR"),
        nombreArchivo: archivo.name,
        tamanoArchivo: `${(archivo.size / 1024).toFixed(2)} KB`,
      },
      datosExtraidos: {
        montoExtraido: datosDelPDF.monto,
        nombreExtraido: datosDelPDF.nombre,
      },
      advertencias: {
        diferenciaMonto: diferenciaMonto ? `El monto del PDF (${datosDelPDF.monto?.toFixed(2)}) no coincide con el formulario ($${monto.toFixed(2)})` : null,
        diferenciaNombre: !coincideNombre ? `El nombre en el PDF no coincide con el cliente seleccionado` : null,
      }
    };
  } catch (error: any) {
    console.error("Error en validación:", error);
    return { error: error.message || "Error al validar la liquidación." };
  }
}

// Crear liquidación después de confirmación
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
        archivoSize: archivo.size,
        archivoType: archivo.type,
      });
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    // 2. Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage.from("Liquidaciones").getPublicUrl(fileName);

    const [anio, mes] = periodo.split("-").map(Number);
    const periodoDate = new Date(anio, mes - 1, 15);
    const vencimientoDate = new Date(vencimiento);

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
    console.error(error);
    return { error: error.message || "Error al crear la liquidación." };
  }
}
