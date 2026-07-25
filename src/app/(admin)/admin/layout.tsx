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
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-chalk/85 px-[var(--gutter)] py-2 backdrop-blur-md">
          <p className="truncate text-step--1 text-kit-soft">
            Signed in as <span className="font-semibold text-kit">{session.user.email}</span>
          </p>
          <div className="flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="rounded-brand px-3 py-1.5 text-step--1 font-semibold text-kit-soft hover:bg-kit/5 hover:text-kit"
            >
              View site ↗
            </a>
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
        </div>
        <main className="px-[var(--gutter)] py-8">{children}</main>
      </div>
    </div>
  );
}
