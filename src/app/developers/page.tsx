import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Developer API",
  description: "Build shipment workflows with the Cascade Logistics API for shipments, documents, invoices, payment proofs, tracking timelines and signed webhooks.",
  path: "/developers",
  keywords: ["logistics API", "shipment tracking API", "freight API Ghana", "Cascade Logistics developers"],
});
export default function DevelopersPage() { return <main className="mx-auto max-w-6xl px-5 py-20"><p className="font-bold uppercase tracking-[0.2em] text-cyan-300">Partner API v1</p><h1 className="mt-4 max-w-4xl text-5xl font-black">Build shipment workflows without rebuilding logistics operations.</h1><p className="mt-6 max-w-2xl text-lg text-slate-400">Create shipments, attach private documents, follow timelines, retrieve invoices, submit payment proof and receive signed webhooks.</p><div className="mt-8 flex gap-3"><Link href="/developers/quickstart" className="rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950">Start in test mode</Link><Link href="/developers/api-reference" className="rounded-lg border border-white/10 px-5 py-3">Explore endpoints</Link></div><div className="mt-16 grid gap-5 md:grid-cols-3">{[["Isolated", "Every key is fixed to one organization, application and environment."],["Private files", "Uploads, invoices and proofs use authorized download routes."],["Reliable events", "Signed, retried webhooks carry stable IDs for deduplication."]].map(([title,body])=><section key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h2 className="font-bold text-cyan-300">{title}</h2><p className="mt-2 text-sm text-slate-400">{body}</p></section>)}</div></main>; }
