import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { partnerPortalCookieName } from "@/lib/partner-platform/portal-session";

export default async function PartnerProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  if (!store.get(partnerPortalCookieName)?.value) redirect("/partner-portal/login");
  return children;
}
