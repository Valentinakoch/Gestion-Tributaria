import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-dark to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-slate-400 text-sm">Registrate en el Sistema de Gestión Tributaria</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignUp 
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#0f2d59",
                colorBackground: "#ffffff",
                colorText: "#0f172a",
                colorTextSecondary: "#64748b",
                colorInputBackground: "#f8fafc",
                colorInputText: "#0f172a",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
              },
              elements: {
                card: { boxShadow: "none" },
                main: { boxShadow: "none" },
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}