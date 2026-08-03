import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProtectedUserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/member-login?callbackUrl=/user-dashboard");
  }

  if (session.user.role === "super_admin") {
    redirect("/backup-dashboard");
  }

  if (session.user.role !== "user") {
    redirect("/admin-dashboard");
  }

  return children;
}
