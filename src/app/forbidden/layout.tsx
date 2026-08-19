import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Access Forbidden",
  description: "You do not have permission to access this Cascade Logistics page.",
  path: "/forbidden",
  noIndex: true,
});

export default function ForbiddenLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
