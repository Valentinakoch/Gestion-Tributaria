"use client";

import { useState } from "react";
import Link from "next/link";
import { crearLiquidacion } from "../../../../lib/actions/liquidaciones.actions";
import { User, Receipt, DollarSign, Calendar, Loader2, Upload, CheckCircle, AlertTriangle, ArrowLeft, FileText, X } from "lucide-react";
import CustomSelect from "@/components/custom-select";

interface Cliente {
  id: string;
  nombre: string;
}

interface Impuesto {
  id_impuesto: number;
  formato: string | null;
}

interface Props {
  clientes: Cliente[];
  impuestos: Impuesto[];
}

function formatMonto(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "," + parts.slice(1).join("") : "";
  if (!integerPart) return decimalPart ? "0" + decimalPart : "";
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formatted + decimalPart;
}

function parseMonto(formatted: string): number {
  const normalized = formatted.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function formatPeriodo(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) result += "/";
    result += digits[i];
  }
  return result;
}

export default function SubirForm({ clientes, impuestos }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [impuestoId, setImpuestoId] = useState("");
  const [montoDisplay, setMontoDisplay] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function handleMontoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "" || /^[\d,]*$/.test(raw.replace(/\./g, ""))) {
      setMontoDisplay(formatMonto(raw));
    }
  }

  function handlePeriodoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPeriodo(formatPeriodo(e.target.value));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setArchivo(file);
    } else if (file) {
      setMensaje({ tipo: "error", texto: "Por favor, seleccioná un archivo PDF válido." });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubiendo(true);
    setMensaje(null);

    if (!clienteId || !impuestoId || !montoDisplay || !periodo || !archivo) {
      setMensaje({ tipo: "error", texto: "Completá todos los campos." });
      setSubiendo(false);
      return;
    }

    const montoNumerico = parseMonto(montoDisplay);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setMensaje({ tipo: "error", texto: "El monto debe ser un número válido mayor a cero." });
      setSubiendo(false);
      return;
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = periodo.match(dateRegex);
    if (!match) {
      setMensaje({ tipo: "error", texto: "La fecha debe tener el formato dd/mm/aaaa." });
      setSubiendo(false);
      return;
    }
    const periodoFormateado = `${match[3]}-${match[2]}-${match[1]}`;

    // Usamos FormData para enviar el archivo de forma segura
    const fd = new FormData();
    fd.append("cuilCliente", clienteId);
    fd.append("idImpuesto", impuestoId);
    fd.append("monto", montoNumerico.toString());
    fd.append("periodo", periodoFormateado);
    fd.append("archivo", archivo);

    const res = await crearLiquidacion(fd);

    if (res.success) {
      setMensaje({ tipo: "ok", texto: "Liquidación creada correctamente." });
      setMontoDisplay("");
      setPeriodo("");
      setArchivo(null);
    } else {
      setMensaje({ tipo: "error", texto: res.error || "Error al crear la liquidación." });
    }
    setSubiendo(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Nueva Liquidación</h2>
            <p className="text-xs text-slate-400">Completá los datos del registro impositivo</p>
          </div>
        </div>

        {mensaje && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {mensaje.tipo === "ok" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />} {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <User className="h-4 w-4 text-slate-400" />
              Cliente
            </label>
            <CustomSelect
              options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
              value={clienteId}
              placeholder="Seleccionar Cliente"
              onChange={(v) => setClienteId(v)}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <Receipt className="h-4 w-4 text-slate-400" />
              Tipo de Impuesto
            </label>
            <CustomSelect
              options={impuestos.map((imp) => ({ value: String(imp.id_impuesto), label: imp.formato || "—" }))}
              value={impuestoId}
              placeholder="Seleccionar Impuesto"
              onChange={(v) => setImpuestoId(v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <DollarSign className="h-4 w-4 text-slate-400" />
                Monto
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={montoDisplay}
                onChange={handleMontoChange}
                placeholder="$ 1.500,00"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Período Fiscal
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={periodo}
                onChange={handlePeriodoChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <FileText className="h-4 w-4 text-slate-400" />
              Comprobante (PDF)
            </label>
            <div className="relative">
              {!archivo ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Hacé click para subir</span> o arrastrá un PDF</p>
                      <p className="text-xs text-slate-400">PDF (Máx. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                  </label>
                </div>
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

          <button
            type="submit"
            disabled={subiendo}
            className="w-full bg-brand-primary text-white font-semibold rounded-xl px-6 py-3 hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {subiendo ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir e Informar al Cliente
              </>
            )}
          </button>
        </form>
      </div>

      <Link
        href="/dashboard"
        className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>
    </div>
  );
}
