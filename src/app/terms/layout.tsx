import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Terms & Conditions",
  description: "Review the terms and conditions governing Cascade Logistics accounts, shipments, payments, warehousing, delivery and related logistics services.",
  path: "/terms",
});

export default function TermsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
