"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, Building2, Check, Clipboard, Clock3, Code2,
  FileClock, KeyRound, Network, PauseCircle, PlayCircle, RefreshCw,
  RotateCw, Search, Send, ShieldCheck, Webhook, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Environment = "test" | "live";
type OrganizationStatus = "pending" | "active" | "suspended" | "archived";

interface Organization {
  id: string; name: string; slug: string; status: OrganizationStatus;
  contacts: { technical?: { email?: string } };
  settings: { customerEmailMode: "partner" | "cascade" | "none"; shipmentVisibility: "organization" | "creating_client" };
  limits: { requestsPerMinute: number; shipmentsPerDay: number; uploadBytesPerDay: number };
  createdAt?: string; approvedAt?: string;
}
interface Application {
  id: string; organizationId?: string; name: string; description?: string;
  status: "active" | "suspended" | "archived"; environmentAccess: Environment[];
  scopes: string[]; requestsPerMinute?: number; createdAt?: string;
}
interface Credential {
  id: string; organizationId?: string; applicationId?: string; keyPrefix: string;
  environment: Environment; scopes: string[]; status: string; expiresAt?: string;
  lastUsedAt?: string; createdAt?: string; revokedAt?: string;
}
interface Usage { organizationId: string; shipments: number; testShipments: number; liveShipments: number; requests: number; errors: number }
interface Control { operation: string; scopeType: string; organizationId?: string; applicationId?: string; environment?: Environment; pausedUntil?: string; reason?: string; publicMessage?: string }
interface RequestLog { requestId: string; organizationId?: string; applicationId?: string; credentialPrefix?: string; environment?: Environment; method: string; routeTemplate: string; responseStatus: number; errorCode?: string; durationMs: number; rateLimitOutcome?: string; createdAt?: string }
interface Endpoint { id: string; organizationId?: string; applicationId?: string; environment: Environment; url: string; description?: string; subscribedEvents: string[]; status: string; secretPrefix: string }
interface Delivery { id: string; eventId: string; endpointId: string; organizationId?: string; applicationId?: string; environment: Environment; status: string; attemptCount: number; replayCount: number; lastStatusCode?: number; lastErrorCode?: string; lastDurationMs?: number; createdAt?: string }
interface DeliveryAttempt { id: string; deliveryId: string; eventId: string; endpointId: string; attemptNumber: number; replayNumber: number; statusCode?: number; errorCode?: string; durationMs?: number; completedAt?: string }
interface Audit { actorType: string; actorId: string; action: string; organizationId?: string; applicationId?: string; targetPublicId?: string; metadata?: unknown; createdAt?: string }
interface PilotObservation { id: string; organizationId?: string; kind: string; category: string; severity: string; summary: string; details?: string; status: "open" | "resolved"; createdAt?: string; resolvedAt?: string; resolution?: string }
interface Pilot {
  id: string; organizationId?: string; status: "sandbox" | "sandbox_accepted" | "live_approved" | "live" | "completed" | "cancelled";
  agreedWorkflows: string[]; expectedVolume: { requestsPerDay: number; shipmentsPerDay: number; uploadBytesPerDay: number };
  pilotQuota: { requestsPerMinute: number; shipmentsPerDay: number; uploadBytesPerDay: number }; supportContactEmail: string;
  securityReview?: { decision: string; keyStorageApproach: string; rotationOwner: string; notes?: string; reviewedAt?: string };
  sandboxAcceptedAt?: string; sandboxNotes?: string; liveApprovedAt?: string; liveApprovalNotes?: string; liveStartedAt?: string; completedAt?: string;
  acceptance: { productionWorkflowsCompleted: boolean; supportProcessAccepted: boolean; noIncidentsConfirmed: boolean };
  metrics: { requests: number; errors: number; errorRatePercent: number; serverErrors: number; p95LatencyMs: number; testShipments: number; liveShipments: number; uploadIntents: number; uploadBytes: number; webhookDeliveries: number; webhookReliabilityPercent: number; openObservations: number; openHighSeverity: number };
  blockers: string[]; readyToComplete: boolean; observations: PilotObservation[];
}
interface ConsoleData {
  generatedAt: string;
  scopes: string[];
  summary: { organizations: number; activeOrganizations: number; applications: number; activeCredentials: number; webhookEndpoints: number; failedDeliveries: number };
  organizations: Organization[]; applications: Application[]; credentials: Credential[];
  usage: Usage[]; controls: Control[]; requestLogs: RequestLog[];
  webhookEndpoints: Endpoint[]; deliveries: Delivery[]; deliveryAttempts: DeliveryAttempt[]; auditLogs: Audit[];
  operationalHealth: { requests: number; serverErrors: number; errorRatePercent: number; authenticationFailures: number; p95LatencyMs: number; webhookBacklog: number; oldestWebhookMinutes: number; pendingEvents: number; workerLastSucceededAt?: string; alerts: Array<{ code: string; severity: string; value: number; threshold: number }> };
  pilots: Pilot[];
}

type Tab = "overview" | "pilot" | "partners" | "applications" | "credentials" | "controls" | "requests" | "webhooks" | "audit";
const panel = "rounded-2xl border border-white/10 bg-white/[0.04]";
const inputClass = "border-white/10 bg-slate-900 text-white placeholder:text-slate-600";
const selectClass = "h-10 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-white";
const pilotWorkflowOptions = [
  ["shipment_creation", "Shipment creation"], ["multiple_file_upload", "Multiple-file upload"],
  ["shipment_tracking", "Shipment tracking"], ["invoice_download", "Invoice download"],
  ["payment_proof", "Payment proof"], ["webhook_delivery", "Webhook delivery"],
] as const;

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Never";
}
function nameFor(items: Array<{ id: string; name: string }>, id?: string) {
  return items.find((item) => item.id === id)?.name || id || "Global";
}
function stateClass(value: string) {
  if (["active", "succeeded", "verified", "live", "completed", "sandbox_accepted"].includes(value)) return "bg-emerald-400/10 text-emerald-300";
  if (["pending", "retrying", "processing", "sandbox", "live_approved"].includes(value)) return "bg-amber-400/10 text-amber-300";
  return "bg-red-400/10 text-red-300";
}

export default function PartnerIntegrationConsole() {
  const [data, setData] = useState<ConsoleData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [revealedKey, setRevealedKey] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedApplication, setSelectedApplication] = useState("");
  const [appScopes, setAppScopes] = useState<string[]>([]);
  const [credentialScopes, setCredentialScopes] = useState<string[]>([]);
  const [requestSearch, setRequestSearch] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/backup-dashboard/integrations", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load partner integrations");
    setData(result);
    setSelectedOrganization((current) => current || result.organizations[0]?.id || "");
  }, []);

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load console")).finally(() => setLoading(false));
  }, [load]);

  const mutate = async (action: Record<string, unknown>, label: string) => {
    setBusy(label); setError(""); setNotice("");
    try {
      const response = await fetch("/api/backup-dashboard/integrations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to complete action");
      if (typeof result.apiKey === "string") setRevealedKey(result.apiKey);
      if (typeof result.temporaryPassword === "string") setRevealedKey(result.temporaryPassword);
      setNotice(label);
      await load();
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete action");
    } finally { setBusy(""); }
  };

  const applicationsForOrganization = useMemo(
    () => data?.applications.filter((application) => application.organizationId === selectedOrganization) || [],
    [data, selectedOrganization],
  );
  useEffect(() => {
    if (!applicationsForOrganization.some((application) => application.id === selectedApplication)) {
      const first = applicationsForOrganization[0];
      setSelectedApplication(first?.id || "");
      setCredentialScopes(first?.scopes || []);
    }
  }, [applicationsForOrganization, selectedApplication]);

  const submitOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "organization.create", data: {
      name: String(form.get("name")), slug: String(form.get("slug")),
      technicalEmail: String(form.get("email") || "") || undefined,
    } }, "Partner organization created");
    event.currentTarget.reset();
  };

  const submitOrganizationSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "organization.update", organizationId: selectedOrganization, data: {
      status: form.get("status"), customerEmailMode: form.get("emailMode"), shipmentVisibility: form.get("visibility"),
      requestsPerMinute: Number(form.get("rpm")), shipmentsPerDay: Number(form.get("daily")),
      uploadBytesPerDay: Number(form.get("uploadMb")) * 1024 * 1024,
    } }, "Partner organization updated");
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "application.create", organizationId: selectedOrganization, data: {
      name: String(form.get("name")), description: String(form.get("description") || "") || undefined,
      environmentAccess: form.getAll("environment"), scopes: appScopes,
      requestsPerMinute: Number(form.get("rpm")) || undefined,
    } }, "Partner application created");
    event.currentTarget.reset(); setAppScopes([]);
  };

  const submitCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const expiry = String(form.get("expiry") || "");
    await mutate({ action: "credential.issue", organizationId: selectedOrganization, applicationId: selectedApplication,
      environment: form.get("environment"), scopes: credentialScopes,
      expiresAt: expiry ? new Date(expiry).toISOString() : undefined,
    }, "API credential issued — copy it now");
  };

  const submitApplicationSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "application.update", organizationId: selectedOrganization, applicationId: selectedApplication, data: {
      name: String(form.get("editName")), description: String(form.get("editDescription") || "") || undefined,
      status: form.get("editStatus"), environmentAccess: form.getAll("editEnvironment"),
      scopes: form.getAll("editScope"), requestsPerMinute: Number(form.get("editRpm")) || undefined,
    } }, "Application permissions and quota updated");
  };

  const submitControl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const until = String(form.get("until") || ""); const scopeType = String(form.get("scopeType"));
    await mutate({ action: "control.set", operation: form.get("operation"), scopeType,
      organizationId: scopeType === "global" ? undefined : selectedOrganization,
      applicationId: scopeType === "application" ? selectedApplication : undefined,
      environment: String(form.get("environment") || "") || undefined,
      pausedUntil: until ? new Date(until).toISOString() : null,
      reason: String(form.get("reason") || "") || undefined,
      publicMessage: String(form.get("message") || "") || undefined,
    }, until ? "Partner API operation paused" : "Partner API operation resumed");
  };

  const submitPilotConfiguration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "pilot.configure", organizationId: selectedOrganization, data: {
      agreedWorkflows: form.getAll("pilotWorkflow"),
      expectedVolume: { requestsPerDay: Number(form.get("expectedRequests")), shipmentsPerDay: Number(form.get("expectedShipments")), uploadBytesPerDay: Number(form.get("expectedUploadMb")) * 1024 * 1024 },
      pilotQuota: { requestsPerMinute: Number(form.get("pilotRpm")), shipmentsPerDay: Number(form.get("pilotShipments")), uploadBytesPerDay: Number(form.get("pilotUploadMb")) * 1024 * 1024 },
      supportContactEmail: String(form.get("pilotSupportEmail")),
    } }, "Pilot configuration saved");
  };

  const submitPilotSecurity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "pilot.security_review", organizationId: selectedOrganization, data: {
      decision: form.get("securityDecision"), keyStorageApproach: form.get("keyStorage"),
      rotationOwner: String(form.get("rotationOwner")), notes: String(form.get("securityNotes") || "") || undefined,
    } }, "Pilot security review recorded");
  };

  const submitPilotAcceptance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "pilot.acceptance_update", organizationId: selectedOrganization, data: {
      productionWorkflowsCompleted: form.get("productionWorkflowsCompleted") === "on",
      supportProcessAccepted: form.get("supportProcessAccepted") === "on",
      noIncidentsConfirmed: form.get("noIncidentsConfirmed") === "on",
    } }, "Pilot acceptance checklist updated");
  };

  const submitPilotObservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "pilot.observation_create", organizationId: selectedOrganization, data: {
      kind: form.get("observationKind"), category: form.get("observationCategory"), severity: form.get("observationSeverity"),
      summary: String(form.get("observationSummary")), details: String(form.get("observationDetails") || "") || undefined,
    } }, "Pilot observation recorded");
    event.currentTarget.reset();
  };

  const submitPilotResolution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate({ action: "pilot.observation_resolve", organizationId: selectedOrganization,
      observationId: form.get("observationId"), resolution: String(form.get("observationResolution")),
    }, "Pilot observation resolved");
    event.currentTarget.reset();
  };

  const filteredRequests = data?.requestLogs.filter((log) =>
    `${log.requestId} ${log.routeTemplate} ${log.errorCode || ""} ${nameFor(data.organizations, log.organizationId)}`.toLowerCase().includes(requestSearch.toLowerCase()),
  ) || [];

  if (loading) return <div className="min-h-screen bg-slate-950 p-10 text-slate-300">Loading integration controls…</div>;
  if (!data) return <div className="min-h-screen bg-slate-950 p-10 text-red-300">{error || "Console unavailable"}</div>;

  const tabs: Array<[Tab, string, typeof Activity]> = [
    ["overview", "Overview", Activity], ["pilot", "Private pilot", ShieldCheck], ["partners", "Partners", Building2], ["applications", "Applications", Code2],
    ["credentials", "Credentials", KeyRound], ["controls", "Controls", PauseCircle], ["requests", "Requests", Search],
    ["webhooks", "Webhooks", Webhook], ["audit", "Audit", FileClock],
  ];
  const selectedOrg = data.organizations.find((item) => item.id === selectedOrganization);
  const selectedApp = data.applications.find((item) => item.id === selectedApplication);
  const selectedPilot = data.pilots.find((item) => item.organizationId === selectedOrganization);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="border-white/10 bg-transparent text-slate-300"><Link href="/backup-dashboard"><ArrowLeft /></Link></Button>
            <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300"><Network className="h-6 w-6" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Owner integrations</p><h1 className="text-xl font-bold">Partner API Control Center</h1></div>
          </div>
          <Button onClick={() => load()} disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {(notice || error) && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>{error || notice}</div>}
        {revealedKey && <section className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-amber-100">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">Copy this API key now</h2><p className="mt-1 text-sm text-amber-200/80">It will not be shown again after this panel is closed or refreshed.</p></div><Button variant="ghost" onClick={() => setRevealedKey("")} className="text-amber-100"><XCircle /></Button></div>
          <div className="mt-4 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-amber-200">{revealedKey}</code><Button onClick={() => navigator.clipboard.writeText(revealedKey)} className="bg-amber-300 text-slate-950 hover:bg-amber-200"><Clipboard className="mr-2 h-4 w-4" />Copy</Button></div>
        </section>}

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2">{tabs.map(([value, label, Icon]) => <button key={value} onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === value ? "bg-cyan-400 text-slate-950" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>

        {tab === "overview" && <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Object.entries(data.summary).map(([key, value]) => <div key={key} className={`${panel} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 text-3xl font-bold text-cyan-300">{value}</p></div>)}</div>
          <section className={`${panel} p-5`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Operational health</h2><p className="text-sm text-slate-400">Rolling 15-minute API signals and webhook worker state.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${data.operationalHealth.alerts.length ? "bg-red-400/10 text-red-300" : "bg-emerald-400/10 text-emerald-300"}`}>{data.operationalHealth.alerts.length ? `${data.operationalHealth.alerts.length} alerts` : "Healthy"}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Requests",data.operationalHealth.requests],["5xx rate",`${data.operationalHealth.errorRatePercent}%`],["p95",`${data.operationalHealth.p95LatencyMs}ms`],["Webhook backlog",data.operationalHealth.webhookBacklog],["Oldest webhook",`${data.operationalHealth.oldestWebhookMinutes}m`]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-900 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div>{data.operationalHealth.alerts.length > 0 && <div className="mt-4 space-y-2">{data.operationalHealth.alerts.map((alert)=><p key={alert.code} className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{alert.severity.toUpperCase()}: {alert.code} is {alert.value} (threshold {alert.threshold})</p>)}</div>}</section>
          <section className={`${panel} overflow-hidden`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Partner usage</h2><p className="text-sm text-slate-400">Shipment and API totals by organization.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr>{["Organization", "Shipments", "Test", "Live", "Requests", "Errors"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody>{data.usage.map((usage) => <tr key={usage.organizationId} className="border-t border-white/5"><td className="px-5 py-3 font-semibold">{nameFor(data.organizations, usage.organizationId)}</td><td className="px-5 py-3">{usage.shipments}</td><td className="px-5 py-3 text-amber-300">{usage.testShipments}</td><td className="px-5 py-3 text-emerald-300">{usage.liveShipments}</td><td className="px-5 py-3">{usage.requests}</td><td className="px-5 py-3 text-red-300">{usage.errors}</td></tr>)}</tbody></table></div></section>
        </div>}

        {tab === "pilot" && <div className="space-y-6">
          <section className={`${panel} p-5`}><div className="flex flex-wrap items-end gap-4"><div className="min-w-64 flex-1"><label className="text-xs font-semibold uppercase text-slate-500">Pilot organization</label><select className={`${selectClass} mt-2`} value={selectedOrganization} onChange={(event) => setSelectedOrganization(event.target.value)}>{data.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} — {organization.status}</option>)}</select></div>{selectedPilot && <div><p className="text-xs uppercase tracking-wider text-slate-500">Pilot stage</p><span className={`mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-bold ${stateClass(selectedPilot.status)}`}>{selectedPilot.status.replaceAll("_", " ")}</span></div>}</div></section>

          {!selectedPilot && <form onSubmit={submitPilotConfiguration} className={`${panel} grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4`}><div className="md:col-span-2 xl:col-span-4"><h2 className="text-lg font-bold">Configure trusted-partner sandbox</h2><p className="text-sm text-slate-400">Record expected volume, agreed workflows, a support contact and conservative limits. No credential is stored here.</p></div><Input name="pilotSupportEmail" type="email" required placeholder="Partner support email" className={inputClass} /><Input name="expectedRequests" type="number" min="1" required defaultValue="500" placeholder="Expected requests/day" className={inputClass} /><Input name="expectedShipments" type="number" min="1" required defaultValue="20" placeholder="Expected shipments/day" className={inputClass} /><Input name="expectedUploadMb" type="number" min="1" required defaultValue="50" placeholder="Expected upload MB/day" className={inputClass} /><Input name="pilotRpm" type="number" min="1" max="300" required defaultValue="60" placeholder="Pilot requests/minute" className={inputClass} /><Input name="pilotShipments" type="number" min="1" max="5000" required defaultValue="100" placeholder="Pilot shipments/day" className={inputClass} /><Input name="pilotUploadMb" type="number" min="1" max="10240" required defaultValue="500" placeholder="Pilot upload MB/day" className={inputClass} /><div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-4">{pilotWorkflowOptions.map(([value,label]) => <label key={value} className="text-sm text-slate-400"><input name="pilotWorkflow" type="checkbox" value={value} defaultChecked className="mr-2" />{label}</label>)}</div><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950 md:col-span-2 xl:col-span-4">Start sandbox governance</Button></form>}

          {selectedPilot && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{[["Requests",selectedPilot.metrics.requests],["Error rate",`${selectedPilot.metrics.errorRatePercent}%`],["p95",`${selectedPilot.metrics.p95LatencyMs}ms`],["Test shipments",selectedPilot.metrics.testShipments],["Live shipments",selectedPilot.metrics.liveShipments],["Webhook reliability",`${selectedPilot.metrics.webhookReliabilityPercent}%`]].map(([label,value]) => <div key={label} className={`${panel} p-4`}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-cyan-300">{value}</p></div>)}</section>

            <div className="grid gap-6 xl:grid-cols-2"><form onSubmit={submitPilotSecurity} className={`${panel} grid gap-4 p-5`}><div><h2 className="font-bold">Partner security review</h2><p className="text-sm text-slate-400">Record the approach only. Never enter an API key or secret.</p></div><select name="securityDecision" defaultValue={selectedPilot.securityReview?.decision || "approved"} className={selectClass}><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select name="keyStorage" defaultValue={selectedPilot.securityReview?.keyStorageApproach || "managed_secret_store"} className={selectClass}><option value="managed_secret_store">Managed secret store</option><option value="encrypted_server_environment">Encrypted server environment</option><option value="other_approved">Other approved method</option></select><Input name="rotationOwner" required defaultValue={selectedPilot.securityReview?.rotationOwner || ""} placeholder="Named key-rotation owner" className={inputClass} /><Input name="securityNotes" defaultValue={selectedPilot.securityReview?.notes || ""} placeholder="Safe review notes" className={inputClass} /><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950">Save security review</Button></form>

              <section className={`${panel} space-y-4 p-5`}><div><h2 className="font-bold">Stage approvals</h2><p className="text-sm text-slate-400">Live approval is unavailable until sandbox and security checks pass.</p></div><div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" disabled={Boolean(busy) || !["sandbox","sandbox_accepted"].includes(selectedPilot.status)} onClick={() => mutate({action:"pilot.sandbox_decision",organizationId:selectedOrganization,accepted:true,notes:"Sandbox acceptance confirmed by owner"},"Sandbox accepted")} className="border-white/10 bg-transparent text-slate-200">Accept sandbox</Button><Button variant="outline" disabled={Boolean(busy) || selectedPilot.status!=="sandbox_accepted" || selectedPilot.securityReview?.decision!=="approved"} onClick={() => mutate({action:"pilot.live_decision",organizationId:selectedOrganization,approved:true,notes:"Limited live pilot approved by owner"},"Live credential approval recorded")} className="border-white/10 bg-transparent text-slate-200">Approve limited live access</Button><Button variant="outline" disabled={Boolean(busy) || selectedPilot.status!=="live_approved"} onClick={() => mutate({action:"pilot.start",organizationId:selectedOrganization},"Live pilot started")} className="border-white/10 bg-transparent text-slate-200">Start live pilot</Button><Button variant="outline" disabled={Boolean(busy) || selectedPilot.status!=="live_approved"} onClick={() => mutate({action:"pilot.live_decision",organizationId:selectedOrganization,approved:false,notes:"Live approval withdrawn by owner"},"Live approval withdrawn")} className="border-red-400/20 bg-transparent text-red-300">Withdraw live approval</Button></div><p className="text-xs text-slate-500">Starting live validation also requires an active approved live credential. Issue it from the Credentials tab after live approval.</p></section></div>

            {selectedPilot.status === "live" && <form onSubmit={submitPilotAcceptance} className={`${panel} grid gap-4 p-5 md:grid-cols-3`}><div className="md:col-span-3"><h2 className="font-bold">Pilot acceptance checklist</h2><p className="text-sm text-slate-400">These owner attestations are checked together with measured traffic, incidents and webhook reliability.</p></div><label className="text-sm text-slate-300"><input name="productionWorkflowsCompleted" type="checkbox" defaultChecked={selectedPilot.acceptance.productionWorkflowsCompleted} className="mr-2" />Agreed production workflows completed</label><label className="text-sm text-slate-300"><input name="supportProcessAccepted" type="checkbox" defaultChecked={selectedPilot.acceptance.supportProcessAccepted} className="mr-2" />Support process is workable</label><label className="text-sm text-slate-300"><input name="noIncidentsConfirmed" type="checkbox" defaultChecked={selectedPilot.acceptance.noIncidentsConfirmed} className="mr-2" />No isolation, duplicate or private-file incident</label><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950 md:col-span-3">Save acceptance checklist</Button></form>}

            <div className="grid gap-6 xl:grid-cols-2"><form onSubmit={submitPilotObservation} className={`${panel} grid gap-4 p-5`}><div><h2 className="font-bold">Feedback, support and defects</h2><p className="text-sm text-slate-400">Record pilot feedback without credentials, private file URLs or customer data.</p></div><div className="grid gap-3 sm:grid-cols-3"><select name="observationKind" className={selectClass}><option value="feedback">Feedback</option><option value="support">Support</option><option value="defect">Defect</option><option value="incident">Incident</option></select><select name="observationCategory" className={selectClass}><option value="documentation">Documentation</option><option value="portal">Portal</option><option value="api">API</option><option value="uploads">Uploads</option><option value="webhooks">Webhooks</option><option value="support">Support</option><option value="duplicate_shipment">Duplicate shipment</option><option value="tenant_isolation">Tenant isolation</option><option value="private_file">Private file</option></select><select name="observationSeverity" className={selectClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div><Input name="observationSummary" required placeholder="Short summary" className={inputClass} /><Input name="observationDetails" placeholder="Safe details" className={inputClass} /><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950">Record observation</Button></form><form onSubmit={submitPilotResolution} className={`${panel} grid h-fit gap-4 p-5`}><h2 className="font-bold">Resolve an observation</h2><select name="observationId" required className={selectClass}><option value="">Select open observation</option>{selectedPilot.observations.filter((item)=>item.status==="open").map((item)=><option key={item.id} value={item.id}>{item.severity} · {item.summary}</option>)}</select><Input name="observationResolution" required placeholder="Resolution and partner confirmation" className={inputClass} /><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950">Mark resolved</Button></form></div>

            <section className={`${panel} overflow-hidden`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Pilot completion</h2><p className="text-sm text-slate-400">The completion report is generated from measured activity and the acceptance record.</p></div>{selectedPilot.blockers.length ? <ul className="space-y-2 p-5 text-sm text-amber-200">{selectedPilot.blockers.map((blocker)=><li key={blocker}>• {blocker}</li>)}</ul> : <p className="p-5 text-sm text-emerald-300">All automated and owner-recorded completion criteria are satisfied.</p>}<div className="border-t border-white/10 p-5"><Button disabled={Boolean(busy)||!selectedPilot.readyToComplete||selectedPilot.status==="completed"} onClick={()=>mutate({action:"pilot.complete",organizationId:selectedOrganization},"Private pilot completed")} className="bg-emerald-400 text-slate-950">Complete private pilot</Button></div></section>

            <section className={`${panel} overflow-x-auto`}><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Created","Kind","Category","Severity","Summary","Status"].map((heading)=><th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody>{selectedPilot.observations.map((item)=><tr key={item.id} className="border-t border-white/5"><td className="px-4 py-3">{formatDate(item.createdAt)}</td><td className="px-4 py-3">{item.kind}</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3">{item.severity}</td><td className="px-4 py-3">{item.summary}</td><td className="px-4 py-3">{item.status}</td></tr>)}</tbody></table></section>
          </>}
        </div>}

        {tab === "partners" && selectedOrg && <form onSubmit={async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate({ action: "member.create", organizationId: selectedOrganization, data: { name: form.get("memberName"), email: form.get("memberEmail"), role: form.get("memberRole") } }, "Portal member created - copy the temporary password now"); event.currentTarget.reset(); }} className={`${panel} mb-6 grid gap-4 p-5 md:grid-cols-4`}><div className="md:col-span-4"><h2 className="text-lg font-bold">Provision partner portal access</h2><p className="text-sm text-slate-400">Create the first owner or another member. The temporary password is shown once.</p></div><Input name="memberName" required placeholder="Member name" className={inputClass} /><Input name="memberEmail" required type="email" placeholder="Work email" className={inputClass} /><select name="memberRole" className={selectClass}><option value="owner">Owner</option><option value="developer">Developer</option><option value="operations_viewer">Operations viewer</option><option value="read_only">Read only</option></select><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950">Create portal member</Button></form>}

        {tab === "partners" && <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={submitOrganization} className={`${panel} h-fit space-y-4 p-5`}><h2 className="text-lg font-bold">Onboard organization</h2><Input name="name" required placeholder="Partner name" className={inputClass} /><Input name="slug" required placeholder="partner-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} /><Input name="email" type="email" placeholder="Technical contact email" className={inputClass} /><Button disabled={Boolean(busy)} className="w-full bg-cyan-500 text-slate-950">Create pending organization</Button></form>
          <div className="space-y-5"><div className={`${panel} p-5`}><label className="text-xs font-semibold uppercase text-slate-500">Organization</label><select className={`${selectClass} mt-2`} value={selectedOrganization} onChange={(e) => setSelectedOrganization(e.target.value)}>{data.organizations.map((org) => <option key={org.id} value={org.id}>{org.name} — {org.status}</option>)}</select></div>
            {selectedOrg && <form key={selectedOrg.id} onSubmit={submitOrganizationSettings} className={`${panel} grid gap-4 p-5 md:grid-cols-2`}><div className="md:col-span-2"><h2 className="text-lg font-bold">Approval, policy and quotas</h2><p className="text-sm text-slate-400">{selectedOrg.id}</p></div><label className="text-sm text-slate-400">Status<select name="status" defaultValue={selectedOrg.status} className={`${selectClass} mt-1`}><option value="pending">Pending</option><option value="active">Active / approved</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label><label className="text-sm text-slate-400">Customer email<select name="emailMode" defaultValue={selectedOrg.settings.customerEmailMode} className={`${selectClass} mt-1`}><option value="partner">Partner sends</option><option value="cascade">Cascade sends</option><option value="none">No direct email</option></select></label><label className="text-sm text-slate-400">Shipment visibility<select name="visibility" defaultValue={selectedOrg.settings.shipmentVisibility} className={`${selectClass} mt-1`}><option value="organization">Organization-wide</option><option value="creating_client">Creating application only</option></select></label><label className="text-sm text-slate-400">Requests/minute<Input name="rpm" type="number" min="1" defaultValue={selectedOrg.limits.requestsPerMinute} className={`${inputClass} mt-1`} /></label><label className="text-sm text-slate-400">Shipments/day<Input name="daily" type="number" min="1" defaultValue={selectedOrg.limits.shipmentsPerDay} className={`${inputClass} mt-1`} /></label><label className="text-sm text-slate-400">Upload quota MB/day<Input name="uploadMb" type="number" min="1" defaultValue={Math.round(selectedOrg.limits.uploadBytesPerDay / 1024 / 1024)} className={`${inputClass} mt-1`} /></label><Button disabled={Boolean(busy)} className="md:col-span-2 bg-cyan-500 text-slate-950"><Check className="mr-2 h-4 w-4" />Save organization</Button></form>}
          </div>
        </div>}

        {tab === "applications" && selectedApp && <form key={selectedApp.id} onSubmit={submitApplicationSettings} className={`${panel} mb-6 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4`}><div className="md:col-span-2 xl:col-span-4"><h2 className="text-lg font-bold">Application access and quota</h2><p className="text-sm text-slate-400">Change scopes, test/live access and the per-client request limit.</p></div><select className={selectClass} value={selectedOrganization} onChange={(e) => setSelectedOrganization(e.target.value)}>{data.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><select className={selectClass} value={selectedApplication} onChange={(e) => setSelectedApplication(e.target.value)}>{applicationsForOrganization.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}</select><Input name="editName" required defaultValue={selectedApp.name} className={inputClass} /><select name="editStatus" defaultValue={selectedApp.status} className={selectClass}><option value="active">Active</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select><Input name="editDescription" defaultValue={selectedApp.description || ""} placeholder="Purpose" className={`${inputClass} md:col-span-2`} /><Input name="editRpm" type="number" min="1" defaultValue={selectedApp.requestsPerMinute || ""} placeholder="Use organization request limit" className={inputClass} /><div className="flex items-center gap-4 text-sm"><label><input type="checkbox" name="editEnvironment" value="test" defaultChecked={selectedApp.environmentAccess.includes("test")} className="mr-2" />Test</label><label><input type="checkbox" name="editEnvironment" value="live" defaultChecked={selectedApp.environmentAccess.includes("live")} className="mr-2" />Live</label></div><div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-4">{data.scopes.map((scope) => <label key={scope} className="text-xs text-slate-400"><input type="checkbox" name="editScope" value={scope} defaultChecked={selectedApp.scopes.includes(scope)} className="mr-2" />{scope}</label>)}</div><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950 md:col-span-2 xl:col-span-4"><Check className="mr-2 h-4 w-4" />Save application access</Button></form>}

        {tab === "applications" && <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><form onSubmit={submitApplication} className={`${panel} h-fit space-y-4 p-5`}><h2 className="text-lg font-bold">Create application</h2><select className={selectClass} value={selectedOrganization} onChange={(e) => setSelectedOrganization(e.target.value)}>{data.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><Input name="name" required placeholder="Application name" className={inputClass} /><Input name="description" placeholder="Purpose" className={inputClass} /><Input name="rpm" type="number" min="1" placeholder="Optional request limit/minute" className={inputClass} /><div className="flex gap-4 text-sm"><label><input type="checkbox" name="environment" value="test" defaultChecked className="mr-2" />Test</label><label><input type="checkbox" name="environment" value="live" className="mr-2" />Live</label></div><div className="grid grid-cols-2 gap-2">{data.scopes.map((scope) => <label key={scope} className="text-xs text-slate-400"><input type="checkbox" checked={appScopes.includes(scope)} onChange={(e) => setAppScopes((current) => e.target.checked ? [...current, scope] : current.filter((item) => item !== scope))} className="mr-2" />{scope}</label>)}</div><Button disabled={Boolean(busy) || appScopes.length === 0} className="w-full bg-cyan-500 text-slate-950">Create application</Button></form><div className="space-y-3">{data.applications.map((app) => <article key={app.id} className={`${panel} p-5`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{app.name}</h3><p className="text-xs text-slate-500">{nameFor(data.organizations, app.organizationId)} · {app.id}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stateClass(app.status)}`}>{app.status}</span></div><p className="mt-3 text-sm text-slate-400">{app.environmentAccess.join(" / ")} · {app.scopes.length} scopes · {app.requestsPerMinute || "organization"} req/min</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => { setSelectedOrganization(app.organizationId || ""); setSelectedApplication(app.id); }} className="border-white/10 bg-transparent text-slate-300">Manage</Button><Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => mutate({ action: "application.update", organizationId: app.organizationId, applicationId: app.id, data: { status: app.status === "active" ? "suspended" : "active" } }, app.status === "active" ? "Application suspended" : "Application activated")} className="border-white/10 bg-transparent text-slate-300">{app.status === "active" ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}{app.status === "active" ? "Suspend" : "Activate"}</Button></div></article>)}</div></div>}

        {tab === "credentials" && <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><form onSubmit={submitCredential} className={`${panel} h-fit space-y-4 p-5`}><h2 className="text-lg font-bold">Issue credential</h2><select className={selectClass} value={selectedOrganization} onChange={(e) => setSelectedOrganization(e.target.value)}>{data.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><select className={selectClass} value={selectedApplication} onChange={(e) => { const id = e.target.value; setSelectedApplication(id); setCredentialScopes(data.applications.find((app) => app.id === id)?.scopes || []); }}>{applicationsForOrganization.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}</select><select name="environment" className={selectClass}><option value="test">Test</option><option value="live">Live</option></select><Input name="expiry" type="datetime-local" className={`${inputClass} [color-scheme:dark]`} /><div className="grid grid-cols-2 gap-2">{(data.applications.find((app) => app.id === selectedApplication)?.scopes || []).map((scope) => <label key={scope} className="text-xs text-slate-400"><input type="checkbox" checked={credentialScopes.includes(scope)} onChange={(e) => setCredentialScopes((current) => e.target.checked ? [...current, scope] : current.filter((item) => item !== scope))} className="mr-2" />{scope}</label>)}</div><Button disabled={Boolean(busy) || !selectedApplication || credentialScopes.length === 0} className="w-full bg-cyan-500 text-slate-950"><KeyRound className="mr-2 h-4 w-4" />Issue one-time key</Button></form><div className={`${panel} overflow-x-auto`}><table className="w-full text-left text-sm"><thead><tr className="text-slate-500">{["Credential", "Application", "Environment", "Status", "Last used", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.credentials.map((credential) => <tr key={credential.id} className="border-t border-white/5"><td className="px-4 py-3"><p className="font-mono text-xs">{credential.keyPrefix}</p><p className="text-xs text-slate-600">{credential.id}</p></td><td className="px-4 py-3">{nameFor(data.applications, credential.applicationId)}</td><td className={`px-4 py-3 font-bold ${credential.environment === "test" ? "text-amber-300" : "text-emerald-300"}`}>{credential.environment}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${stateClass(credential.status)}`}>{credential.status}</span></td><td className="px-4 py-3 text-xs text-slate-400">{formatDate(credential.lastUsedAt)}</td><td className="px-4 py-3"><div className="flex gap-1"><Button size="sm" variant="ghost" disabled={credential.status !== "active" || Boolean(busy)} onClick={() => mutate({ action: "credential.rotate", organizationId: credential.organizationId, credentialId: credential.id }, "Credential rotated — copy the replacement now")}><RotateCw className="h-4 w-4" /></Button><Button size="sm" variant="ghost" disabled={credential.status !== "active" || Boolean(busy)} onClick={() => mutate({ action: "credential.revoke", organizationId: credential.organizationId, credentialId: credential.id, reason: "Revoked from owner console" }, "Credential revoked")} className="text-red-300"><XCircle className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></div>}

        {tab === "controls" && <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><form onSubmit={submitControl} className={`${panel} h-fit grid gap-4 p-5`}><h2 className="text-lg font-bold">Scoped API pause</h2><select name="scopeType" className={selectClass}><option value="global">Global</option><option value="organization">Organization</option><option value="application">Application</option></select><select className={selectClass} value={selectedOrganization} onChange={(e) => setSelectedOrganization(e.target.value)}>{data.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><select className={selectClass} value={selectedApplication} onChange={(e) => setSelectedApplication(e.target.value)}>{applicationsForOrganization.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}</select><select name="operation" className={selectClass}><option value="*">All API operations</option><option value="api_access">API access</option>{data.scopes.map((scope) => <option key={scope} value={scope}>{scope}</option>)}</select><select name="environment" className={selectClass}><option value="">Both environments</option><option value="test">Test</option><option value="live">Live</option></select><Input name="until" type="datetime-local" className={`${inputClass} [color-scheme:dark]`} /><Input name="reason" placeholder="Private owner reason" className={inputClass} /><Input name="message" placeholder="Safe message returned to partner" className={inputClass} /><p className="text-xs text-slate-500">Leave “Pause until” empty to resume the selected scope immediately.</p><Button disabled={Boolean(busy)} className="bg-cyan-500 text-slate-950"><Clock3 className="mr-2 h-4 w-4" />Apply control</Button></form><div className="space-y-3">{data.controls.length === 0 ? <div className={`${panel} p-8 text-slate-500`}>No scoped controls configured.</div> : data.controls.map((control, index) => <article key={`${control.operation}-${control.scopeType}-${index}`} className={`${panel} p-4`}><div className="flex justify-between gap-3"><div><p className="font-bold">{control.operation}</p><p className="text-xs text-slate-500">{control.scopeType} · {nameFor(data.organizations, control.organizationId)} · {nameFor(data.applications, control.applicationId)} · {control.environment || "both"}</p></div><span className={`rounded-full px-2 py-1 text-xs ${control.pausedUntil && new Date(control.pausedUntil) > new Date() ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{control.pausedUntil && new Date(control.pausedUntil) > new Date() ? "PAUSED" : "ACTIVE"}</span></div>{control.pausedUntil && <p className="mt-2 text-xs text-slate-400">Until {formatDate(control.pausedUntil)} · {control.reason}</p>}</article>)}</div></div>}

        {tab === "requests" && <section className={`${panel} overflow-hidden`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5"><div><h2 className="font-bold">Sanitized request logs</h2><p className="text-xs text-slate-500">Latest 100 requests. No API secrets or raw IP addresses.</p></div><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" /><Input value={requestSearch} onChange={(e) => setRequestSearch(e.target.value)} placeholder="Search logs" className={`${inputClass} pl-9`} /></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Time", "Partner", "Route", "Status", "Duration", "Request ID"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{filteredRequests.map((log) => <tr key={log.requestId} className="border-t border-white/5"><td className="whitespace-nowrap px-4 py-3">{formatDate(log.createdAt)}</td><td className="px-4 py-3">{nameFor(data.organizations, log.organizationId)}<br /><span className="text-slate-600">{log.environment}</span></td><td className="px-4 py-3 font-mono">{log.method} {log.routeTemplate}</td><td className={`px-4 py-3 font-bold ${log.responseStatus >= 400 ? "text-red-300" : "text-emerald-300"}`}>{log.responseStatus} {log.errorCode}</td><td className="px-4 py-3">{log.durationMs}ms</td><td className="px-4 py-3 font-mono text-slate-500">{log.requestId}</td></tr>)}</tbody></table></div></section>}

        {tab === "webhooks" && <div className="space-y-6"><section className={`${panel} overflow-x-auto`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Webhook endpoints</h2></div><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Partner / app", "Endpoint", "Environment", "Status", "Events"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.webhookEndpoints.map((endpoint) => <tr key={endpoint.id} className="border-t border-white/5"><td className="px-4 py-3">{nameFor(data.organizations, endpoint.organizationId)}<br /><span className="text-slate-600">{nameFor(data.applications, endpoint.applicationId)}</span></td><td className="max-w-md truncate px-4 py-3 font-mono">{endpoint.url}<br /><span className="text-slate-600">{endpoint.secretPrefix}…</span></td><td className="px-4 py-3">{endpoint.environment}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 ${stateClass(endpoint.status)}`}>{endpoint.status}</span></td><td className="px-4 py-3">{endpoint.subscribedEvents.length}</td></tr>)}</tbody></table></section><section className={`${panel} overflow-x-auto`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Recent deliveries</h2><p className="text-xs text-slate-500">Manual replay preserves the event ID for receiver deduplication.</p></div><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Created", "Partner", "Event", "Status", "Attempts", "Last result", "Action"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.deliveries.map((delivery) => <tr key={delivery.id} className="border-t border-white/5"><td className="px-4 py-3">{formatDate(delivery.createdAt)}</td><td className="px-4 py-3">{nameFor(data.organizations, delivery.organizationId)}</td><td className="px-4 py-3 font-mono">{delivery.eventId}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 ${stateClass(delivery.status)}`}>{delivery.status}</span></td><td className="px-4 py-3">{delivery.attemptCount} / replay {delivery.replayCount}</td><td className="px-4 py-3">{delivery.lastStatusCode || delivery.lastErrorCode || "—"}<br /><span className="text-slate-600">{delivery.lastDurationMs ? `${delivery.lastDurationMs}ms` : ""}</span></td><td className="px-4 py-3"><Button size="sm" variant="ghost" disabled={delivery.status === "processing" || Boolean(busy)} onClick={() => mutate({ action: "delivery.replay", deliveryId: delivery.id }, "Webhook delivery queued for replay")}><Send className="h-4 w-4" /></Button></td></tr>)}</tbody></table></section></div>}

        {tab === "webhooks" && <section className={`${panel} mt-6 overflow-x-auto`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Delivery attempts</h2><p className="text-xs text-slate-500">Latest signed delivery results, including replay attempts.</p></div><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Completed", "Delivery", "Event", "Attempt", "Replay", "Result", "Duration"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.deliveryAttempts.map((attempt) => <tr key={attempt.id} className="border-t border-white/5"><td className="whitespace-nowrap px-4 py-3">{formatDate(attempt.completedAt)}</td><td className="px-4 py-3 font-mono">{attempt.deliveryId}</td><td className="px-4 py-3 font-mono">{attempt.eventId}</td><td className="px-4 py-3">{attempt.attemptNumber}</td><td className="px-4 py-3">{attempt.replayNumber}</td><td className={`px-4 py-3 font-bold ${attempt.statusCode && attempt.statusCode < 300 ? "text-emerald-300" : "text-red-300"}`}>{attempt.statusCode || attempt.errorCode || "No response"}</td><td className="px-4 py-3">{attempt.durationMs === undefined ? "-" : `${attempt.durationMs}ms`}</td></tr>)}</tbody></table></section>}

        {tab === "audit" && <section className={`${panel} overflow-x-auto`}><div className="border-b border-white/10 p-5"><h2 className="font-bold">Privileged integration audit</h2><p className="text-xs text-slate-500">Latest 100 redacted actions.</p></div><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{["Time", "Actor", "Action", "Partner", "Target", "Safe metadata"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.auditLogs.map((audit, index) => <tr key={`${audit.createdAt}-${index}`} className="border-t border-white/5 align-top"><td className="whitespace-nowrap px-4 py-3">{formatDate(audit.createdAt)}</td><td className="px-4 py-3">{audit.actorType}<br /><span className="text-slate-600">{audit.actorId}</span></td><td className="px-4 py-3 font-semibold">{audit.action}</td><td className="px-4 py-3">{nameFor(data.organizations, audit.organizationId)}</td><td className="px-4 py-3 font-mono">{audit.targetPublicId || "—"}</td><td className="max-w-md px-4 py-3 font-mono text-slate-500"><pre className="whitespace-pre-wrap">{JSON.stringify(audit.metadata || {}, null, 1)}</pre></td></tr>)}</tbody></table></section>}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />This console is available only to the protected super-admin session. Every integration mutation is recorded in the privileged audit log.</div>
      </main>
    </div>
  );
}
