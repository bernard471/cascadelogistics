"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Code2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPortalLogin() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/partner-portal/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationSlug: form.get("organizationSlug"), email: form.get("email"), password: form.get("password") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to sign in");
      router.push("/partner-portal"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in"); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-12 text-white"><div className="mx-auto max-w-md"><Link href="/developers" className="mb-8 inline-flex items-center gap-2 text-sm text-cyan-300"><ArrowLeft className="h-4 w-4" />Developer documentation</Link><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl"><div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300"><Code2 /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Cascade Developers</p><h1 className="text-2xl font-bold">Partner portal</h1></div></div><p className="mb-6 text-sm text-slate-400">Use the organization slug and member credentials supplied by your integration owner.</p>{error && <div role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}<form onSubmit={submit} className="space-y-4"><Input name="organizationSlug" required autoComplete="organization" placeholder="Organization slug" className="border-white/10 bg-slate-900" /><Input name="email" required type="email" autoComplete="email" placeholder="Work email" className="border-white/10 bg-slate-900" /><Input name="password" required type="password" autoComplete="current-password" placeholder="Password" className="border-white/10 bg-slate-900" /><Button disabled={busy} className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"><LockKeyhole className="mr-2 h-4 w-4" />{busy ? "Signing in..." : "Sign in securely"}</Button></form></div></div></main>;
}
