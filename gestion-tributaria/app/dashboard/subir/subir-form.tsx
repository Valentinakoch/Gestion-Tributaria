"use client";

import { useState } from "react";
import Link from "next/link";
import { crearLiquidacion } from "@/actions";
import { User, Receipt, DollarSign, Calendar, Loader2, Upload, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
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
  const [clienteId, setClienteId] = useState(clientes[0]?.id || "");
  const [impuestoId, setImpuestoId] = useState(String(impuestos[0]?.id_impuesto || ""));
  const [montoDisplay, setMontoDisplay] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubiendo(true);
    setMensaje(null);

    if (!clienteId || !impuestoId || !montoDisplay || !periodo) {
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

    const res = await crearLiquidacion({
      cuilCliente: clienteId,
      idImpuesto: Number(impuestoId),
      monto: montoNumerico,
      periodo: periodoFormateado,
    });

    if (res.success) {
      setMensaje({ tipo: "ok", texto: "Liquidación creada correctamente." });
      setMontoDisplay("");
      setPeriodo("");
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
