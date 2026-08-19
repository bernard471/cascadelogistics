import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Member Dashboard",
  description: "Private Cascade Logistics member account area.",
  path: "/user-dashboard",
  noIndex: true,
});

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
