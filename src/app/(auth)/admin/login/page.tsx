import type { Metadata } from "next";
import { MoyoursCrest } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-pitch-deep px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center text-chalk">
          <MoyoursCrest size={64} />
          <h1 className="font-display text-step-1">Moyours admin</h1>
          <p className="text-step--1 text-chalk-dim">
            Sign in to manage registrations, fixtures, and results.
          </p>
        </div>
        <div className="rounded-brand border border-line/30 bg-chalk p-6 shadow-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
