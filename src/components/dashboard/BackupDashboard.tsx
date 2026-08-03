"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  Clock3,
  LogOut,
  PackagePlus,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OperationName = "create" | "update" | "submit";

interface OperationState {
  pausedUntil: string | null;
  reason: string | null;
  isPaused: boolean;
}

type Operations = Record<OperationName, OperationState>;

const operationDetails: Record<
  OperationName,
  { title: string; description: string; icon: typeof Activity }
> = {
  create: {
    title: "Creating shipments",
    description: "Controls shipments created by administrators and staff.",
    icon: PackagePlus,
  },
  update: {
    title: "Updating shipments",
    description: "Controls single, bulk, and invoice updates by customers and operations staff.",
    icon: RefreshCw,
  },
  submit: {
    title: "Submitting shipments",
    description: "Controls new shipment submissions from customer accounts.",
    icon: Upload,
  },
};

const emptyOperations: Operations = {
  create: { pausedUntil: null, reason: null, isPaused: false },
  update: { pausedUntil: null, reason: null, isPaused: false },
  submit: { pausedUntil: null, reason: null, isPaused: false },
};

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function BackupDashboard() {
  const { data: session } = useSession();
  const [operations, setOperations] = useState<Operations>(emptyOperations);
  const [untilValues, setUntilValues] = useState<Record<OperationName, string>>({
    create: "",
    update: "",
    submit: "",
  });
  const [reasons, setReasons] = useState<Record<OperationName, string>>({
    create: "",
    update: "",
    submit: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<OperationName | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadOperations = useCallback(async () => {
    setError("");
    const response = await fetch("/api/backup-dashboard/operations", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load controls");
    setOperations(data.operations);
  }, []);

  useEffect(() => {
    loadOperations()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [loadOperations]);

  const setQuickDuration = (action: OperationName, hours: number) => {
    setUntilValues((current) => ({
      ...current,
      [action]: toLocalInputValue(new Date(Date.now() + hours * 60 * 60 * 1000)),
    }));
  };

  const updateOperation = async (action: OperationName, resume = false) => {
    setSaving(action);
    setError("");
    setNotice("");

    try {
      const localUntil = untilValues[action];
      if (!resume && !localUntil) throw new Error("Choose when this pause should end.");

      const response = await fetch("/api/backup-dashboard/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pausedUntil: resume ? null : new Date(localUntil).toISOString(),
          reason: reasons[action],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update control");

      setOperations(data.operations);
      setNotice(data.message);
      if (resume) {
        setUntilValues((current) => ({ ...current, [action]: "" }));
        setReasons((current) => ({ ...current, [action]: "" }));
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update control");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Owner controls
              </p>
              <h1 className="text-xl font-bold">Backup Dashboard</h1>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/member-login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-9 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-4 flex items-center gap-3 text-cyan-300">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Shipment activity</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Timed operation controls</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Pauses are enforced by the server and end automatically at the selected time. The owner account remains able to access this dashboard and restore service.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="mt-2 font-semibold text-white">{session?.user?.name || "Owner"}</p>
            <p className="mt-1 text-sm text-slate-400">{session?.user?.email}</p>
            <div className="mt-5 inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Protected super admin session
            </div>
          </section>
        </div>

        {(notice || error) && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
            {error || notice}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-2xl bg-white/[0.05]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {(Object.keys(operationDetails) as OperationName[]).map((action) => {
              const details = operationDetails[action];
              const state = operations[action];
              const Icon = details.icon;
              return (
                <section key={action} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl bg-white/[0.06] p-2.5 text-cyan-300"><Icon className="h-5 w-5" /></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.isPaused ? "bg-amber-400/15 text-amber-300" : "bg-emerald-400/15 text-emerald-300"}`}>
                      {state.isPaused ? "PAUSED" : "ACTIVE"}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{details.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-5 text-slate-400">{details.description}</p>

                  {state.isPaused && state.pausedUntil && (
                    <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-3 text-sm text-amber-100">
                      <div className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" />Paused until</div>
                      <p className="mt-1 text-xs text-amber-200/80">{new Date(state.pausedUntil).toLocaleString()}</p>
                      {state.reason && <p className="mt-2 text-xs text-amber-200/70">{state.reason}</p>}
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Pause until</label>
                    <Input
                      type="datetime-local"
                      min={toLocalInputValue(new Date(Date.now() + 60_000))}
                      value={untilValues[action]}
                      onChange={(event) => setUntilValues((current) => ({ ...current, [action]: event.target.value }))}
                      className="border-white/10 bg-slate-900 text-white [color-scheme:dark]"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {[[1, "1 hour"], [24, "1 day"], [168, "7 days"]].map(([hours, label]) => (
                        <button key={label} type="button" onClick={() => setQuickDuration(action, Number(hours))} className="rounded-lg border border-white/10 px-2 py-2 text-xs text-slate-300 hover:bg-white/[0.06]">
                          {label}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Reason shown when an action is blocked"
                      maxLength={250}
                      value={reasons[action]}
                      onChange={(event) => setReasons((current) => ({ ...current, [action]: event.target.value }))}
                      className="border-white/10 bg-slate-900 text-white placeholder:text-slate-600"
                    />
                    <Button disabled={saving === action} onClick={() => updateOperation(action)} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                      <Save className="mr-2 h-4 w-4" />{saving === action ? "Saving..." : "Set timed pause"}
                    </Button>
                    {state.isPaused && (
                      <Button disabled={saving === action} variant="outline" onClick={() => updateOperation(action, true)} className="w-full border-emerald-400/25 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200">
                        <PlayCircle className="mr-2 h-4 w-4" />Resume now
                      </Button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          Read-only shipment viewing and public tracking remain available during a pause. Every control change is recorded in an owner-only audit collection.
        </div>
      </main>
    </div>
  );
}

