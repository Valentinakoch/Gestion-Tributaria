"use client";

import { useState, useRef, useEffect } from "react";
import { Show, UserButton, useClerk } from "@clerk/nextjs";

export default function UserMenu() {
  const { openSignIn, openSignUp } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </button>
          {open && (
            <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => { openSignIn({}); setOpen(false); }}
                className="w-full rounded-t-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { openSignUp({}); setOpen(false); }}
                className="w-full rounded-b-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      }
    >
      <UserButton />
    </Show>
  );
}
