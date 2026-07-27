import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/member-login?callbackUrl=/admin-dashboard");
  }

  if (!["admin", "staff"].includes(session.user.role)) {
    redirect("/forbidden");
  }

  return children;
}

