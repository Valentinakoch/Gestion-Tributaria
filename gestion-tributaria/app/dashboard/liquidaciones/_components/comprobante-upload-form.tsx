"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { subirComprobantePago } from "../../../../lib/actions/liquidaciones.actions"; 
import * as pdfjsLib from "pdfjs-dist";

// Configuración del Worker para PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface ComprobanteUploadFormProps {
  liquidacionId: number;
  // Quitamos onSuccess y onError de las props obligatorias para que la página no chille
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="w-full bg-brand-primary text-white font-semibold rounded-xl px-6 py-3 hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo...
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Subir Comprobante
        </>
      )}
    </button>
  );
}

// Función auxiliar para extraer el texto en el cliente
async function extraerTextoDePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(" ") + " ";
    }
    return fullText;
  } catch (error) {
    console.error("Error al extraer texto con PDF.js:", error);
    throw new Error("No se pudo leer el contenido del PDF. Asegurate de que no esté protegido.");
  }
}

export default function ComprobanteUploadForm({ liquidacionId }: ComprobanteUploadFormProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  
  // Ahora el formulario gestiona su propio feedback localmente
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setArchivo(file);
      setError(null); 
    } else if (file) {
      setArchivo(null);
      setError("Por favor, seleccioná un archivo PDF válido.");
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!archivo) {
      setError("Por favor, seleccioná un archivo PDF.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // 1. Extraemos el texto usando PDF.js en el cliente
      const textoExtraido = await extraerTextoDePDF(archivo);
      
      // 2. Adjuntamos las variables requeridas por el Server Action
      formData.append("liquidacionId", String(liquidacionId));
      formData.append("archivo", archivo);
      formData.append("textoPDF", textoExtraido);

      // 3. Enviamos los datos al backend
      const res = await subirComprobantePago(formData);

      if (res.success) {
        setSuccess(res.message || "Comprobante subido y liquidación marcada como pagada.");
        setArchivo(null);
      } else {
        setError(res.error || "Error al subir el comprobante.");
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo.");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Mensajes de feedback visual */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl">
          {success}
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <FileText className="h-4 w-4 text-slate-400" />
          Archivo del Comprobante (PDF)
        </label>

        <div className="relative">
          {!archivo ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Hacé click para subir</span> o arrastrá un PDF
                </p>
                <p className="text-xs text-slate-400">PDF (Máx. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">{archivo.name}</p>
                <p className="text-xs text-blue-500">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}