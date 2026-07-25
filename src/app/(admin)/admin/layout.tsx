import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata = {
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-chalk">
      <AdminSidebar adminName={session.user.name ?? session.user.email ?? "Admin"} />
      <div className="lg:pl-56">
        <div className="flex items-center justify-end border-b border-line bg-white/50 px-[var(--gutter)] py-2">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-brand px-3 py-1.5 text-step--1 font-semibold text-kit-soft hover:bg-kit/5 hover:text-kit"
            >
              Sign out
            </button>
          </form>
        </div>
        <main className="px-[var(--gutter)] py-8">{children}</main>
      </div>
    </div>
  );
}
