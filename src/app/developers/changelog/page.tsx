import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "API Changelog",
  description: "Follow Cascade Logistics API updates for shipment workflows, private files, invoices, payment proofs, signed webhooks and developer tooling.",
  path: "/developers/changelog",
});

export default function Changelog(){return <main className="mx-auto max-w-4xl px-5 py-14"><h1 className="text-4xl font-black">API changelog</h1><article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6"><p className="text-sm text-cyan-300">2026-08-06 · v1 initial release candidate</p><ul className="mt-4 list-disc space-y-2 pl-5 text-slate-400"><li>Shipment creation, editing, cancellation and lifecycle tracking.</li><li>Private multi-file uploads, invoices and payment proofs.</li><li>Signed durable webhooks with retries, attempts and replay.</li><li>Developer portal with isolated test/live operations.</li></ul></article></main>}
