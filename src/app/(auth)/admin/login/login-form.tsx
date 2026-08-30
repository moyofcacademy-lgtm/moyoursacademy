"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-step--1 font-semibold">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@moyoursacademy.ng"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-step--1 font-semibold">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p role="alert" className="text-step--1 font-medium text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="mt-2">
        Sign in
      </Button>
    </form>
  );
}
