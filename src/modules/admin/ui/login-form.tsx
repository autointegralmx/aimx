"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginState,
} from "@/modules/admin/application/auth-actions";
import { Button } from "@/shared/ui/button";

const initial: LoginState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />
      <div>
        <label htmlFor="email" className="text-sm text-ink-muted">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full border border-line bg-surface px-3 py-3.5 text-ink"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm text-ink-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="mt-2 w-full border border-line bg-surface px-3 py-3.5 text-ink"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
