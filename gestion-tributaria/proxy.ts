import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 1. Definimos las rutas públicas
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)'
])

const clerkHandler = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const currentUrl = new URL(request.url)

  // Si ya está logueado y accede a las rutas de auth, lo mandamos al dashboard.
  // No redirigimos automáticamente desde '/' porque el dashboard puede necesitar
  // completar el perfil antes de que tenga sentido volver a root.
  if (userId && (currentUrl.pathname.startsWith('/sign-in') || currentUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si no está logueado y quiere entrar a algo privado, al login
  if (!userId && !isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
})

export async function proxy(request: any, event: any) {
  return clerkHandler(request, event)
}

// 2. MATCHER SIMPLIFICADO: Sin expresiones regulares complejas
// Le decimos al proxy exactamente qué carpetas reales de tu app queremos que escuche.
export const config = {
  matcher: [
    '/',                  // Escucha la landing page
    '/dashboard/:path*',  // Escucha todo el panel privado
    '/seleccionar-rol',   // Escucha la selección de rol
    '/sign-in/:path*',    // Escucha el login
    '/sign-up/:path*',    // Escucha el registro
    '/api/:path*'         // Escucha tus rutas de backend internas
  ],
}