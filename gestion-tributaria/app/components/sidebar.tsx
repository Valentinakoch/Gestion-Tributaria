"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Folder,
  Users,
  Upload,
  FileText,
  BarChart3,
  Calendar,
  Mail,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userRole: "ADMIN" | "CLIENTE";
}

const adminNav = [
  { href: "/dashboard", label: "Padrón de Clientes", icon: Users },
  { href: "/dashboard/subir", label: "Subir Liquidación", icon: Upload },
  { href: "/dashboard/liquidaciones", label: "Listado Liquidaciones", icon: FileText },
  { href: "/dashboard/turnos", label: "Turnos", icon: Calendar },
];

const clientNav = [
  { href: "/dashboard", label: "Situación Impositiva", icon: BarChart3 },
  { href: "/dashboard/turnos", label: "Turnos", icon: Calendar },
  { href: "/dashboard/contacto", label: "Contacto", icon: Mail },
];

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const nav = userRole === "ADMIN" ? adminNav : clientNav;

  const isAdmin = userRole === "ADMIN";

  return (
    <aside
      className={`w-64 p-6 flex flex-col justify-between shrink-0 h-screen sticky top-0 ${
        isAdmin ? "bg-brand-dark" : "bg-white border-r border-slate-200"
      }`}
    >
      <div>
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-8 px-2">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              isAdmin ? "bg-white/20" : "bg-brand-dark"
            }`}
          >
            <Folder className={`h-4 w-4 ${isAdmin ? "text-white" : "text-white"}`} />
          </div>
          <span
            className={`font-bold text-lg tracking-tight ${
              isAdmin ? "text-white" : "text-brand-dark"
            }`}
          >
            ESTUDIO
          </span>
        </Link>

        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isAdmin
                    ? isActive
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                    : isActive
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
      </div>

      <div
        className={`flex items-center gap-3 pt-4 ${
          isAdmin ? "border-t border-white/10" : "border-t border-slate-100"
        }`}
      >
        <UserButton />
        <div className="text-xs truncate">
          <p
            className={`font-semibold truncate ${
              isAdmin ? "text-white" : "text-slate-700"
            }`}
          >
            {userName}
          </p>
          <p className="text-slate-400 capitalize">{userRole.toLowerCase()}</p>
        </div>
      </div>
    </aside>
  );
}
