import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isPartnerPlatformEnabled } from "@/lib/partner-platform/feature";
import { partnerPortalCookieName } from "@/lib/partner-platform/portal-session";

export default async function PartnerProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isPartnerPlatformEnabled()) notFound();
  const store = await cookies();
  if (!store.get(partnerPortalCookieName)?.value) redirect("/partner-portal/login");
  return children;
}
