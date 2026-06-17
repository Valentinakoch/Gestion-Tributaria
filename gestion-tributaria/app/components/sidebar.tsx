"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Upload,
  FileText,
  BarChart3,
  Calendar,
  Building2,
  MessageCircle,
  Home,
} from "lucide-react";

interface SidebarProps {
  userRole: "ADMIN" | "CLIENTE";
}

const adminNav = [
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/subir", label: "Subir Liquidación", icon: Upload },
  { href: "/dashboard/liquidaciones", label: "Listado Liquidaciones", icon: FileText },
  { href: "/dashboard/entidades", label: "Entidades Tributarias", icon: Building2 },
  { href: "/dashboard/turnos", label: "Turnos", icon: Calendar },
  { href: "/dashboard/chat", label: "Mensajes", icon: MessageCircle },
];

const clientNav = [
  { href: "/dashboard", label: "Situación Impositiva", icon: BarChart3 },
  { href: "/dashboard/turnos", label: "Turnos", icon: Calendar },
  { href: "/dashboard/chat", label: "Mensajes", icon: MessageCircle },
];

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const nav = userRole === "ADMIN" ? adminNav : clientNav;

  return (
    <aside className="w-56 flex-none flex flex-col overflow-y-auto p-5 bg-white border-r border-slate-200">
      <nav className="space-y-1">
        {/* Inicio */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <Home className="h-4 w-4 shrink-0" />
          Inicio
        </Link>

        <div className="my-2 border-t border-slate-100" />

        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-slate-100 text-brand-dark font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
