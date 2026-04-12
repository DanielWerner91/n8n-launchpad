import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user ? { email: user.email } : null} />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
