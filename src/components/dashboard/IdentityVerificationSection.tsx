"use client";

import {
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VerificationStatus =
  | "pending"
  | "under-review"
  | "verified"
  | "rejected"
  | "resubmission-required";

type VerificationSummary = {
  id: string;
  status: VerificationStatus;
  documentType: string;
  documentNumberLast4: string;
  selfieCaptureMethod: "camera" | "upload";
  livenessStatus: string;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
  };
};

type VerificationDetail = {
  verification: {
    id: string;
    status: VerificationStatus;
    documentType: string;
    documentNumberLast4: string;
    selfieCaptureMethod: "camera" | "upload";
    livenessStatus: string;
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
    reviewNotes?: string;
    documentRetentionExpiresAt?: string;
    documentsPurgedAt?: string;
    files: {
      documentFront: string | null;
      documentBack: string | null;
      selfie: string | null;
      documentFrontType?: string;
      documentBackType?: string;
      selfieType?: string;
    };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    stateRegion?: string;
    country?: string;
    postalCode?: string;
    digitalAddress?: string;
    emailVerified?: boolean;
  } | null;
};

const labels: Record<string, string> = {
  "ghana-card": "Ghana Card",
  passport: "Passport",
  "drivers-licence": "Driver’s licence",
  "residence-permit": "Residence permit",
  pending: "Pending",
  "under-review": "Under review",
  verified: "Verified",
  rejected: "Rejected",
  "resubmission-required": "Resubmission required",
};

const badgeClasses: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  "under-review": "bg-blue-50 text-blue-700",
  verified: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  "resubmission-required": "bg-orange-50 text-orange-700",
};

export default function IdentityVerificationSection() {
  const [records, setRecords] = useState<VerificationSummary[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    verified: 0,
    rejected: 0,
    resubmissionRequired: 0,
  });
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<VerificationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [decision, setDecision] = useState<
    "approve" | "reject" | "request-resubmission"
  >("approve");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(
        `/api/admin/identity-verifications?${params.toString()}`
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load reviews");
      setRecords(result.verifications);
      setStats(result.stats);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load reviews"
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(fetchRecords, 250);
    return () => window.clearTimeout(timeout);
  }, [fetchRecords]);

  const openVerification = async (id: string) => {
    setIsDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/identity-verifications/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load review");
      setSelected(result);
      setDecision("approve");
      setReason("");
      setNotes("");
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load review"
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const saveDecision = async () => {
    if (!selected) return;
    if (decision !== "approve" && reason.trim().length < 5) {
      setError("Provide a clear reason for the customer.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/identity-verifications/${selected.verification.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: decision, reason, notes }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save decision");
      setMessage(result.message);
      setSelected(null);
      await fetchRecords();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save decision"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          Identity verification
        </h1>
        <p className="mt-1 text-gray-600">
          Review private identity documents and manually compare each selfie.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending" value={stats.pending} icon={Clock3} color="text-amber-600" />
        <StatCard label="Under review" value={stats.underReview} icon={Eye} color="text-blue-600" />
        <StatCard label="Verified" value={stats.verified} icon={CheckCircle2} color="text-green-600" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="text-red-600" />
        <StatCard label="Resubmission" value={stats.resubmissionRequired} icon={FileWarning} color="text-orange-600" />
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or username"
          />
        </div>
        <select
          className="h-10 rounded-md border border-gray-300 px-3"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under-review">Under review</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="resubmission-required">Resubmission required</option>
        </select>
        <Button type="button" variant="outline" onClick={fetchRecords}>
          <RefreshCw className="mr-2 h-4 w-4" />Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />Loading reviews…
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            No identity verifications match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Document</th>
                  <th className="px-5 py-4">Selfie</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{record.user.name}</p>
                      <p className="text-sm text-gray-500">{record.user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <p>{labels[record.documentType] || record.documentType}</p>
                      <p className="text-gray-500">ending {record.documentNumberLast4}</p>
                    </td>
                    <td className="px-5 py-4 text-sm capitalize">
                      {record.selfieCaptureMethod}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {new Date(record.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Button type="button" size="sm" variant="outline" onClick={() => openVerification(record.id)}>
                        <Eye className="mr-2 h-4 w-4" />Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-8"><Loader2 className="h-8 w-8 animate-spin text-[#315694]" /></div>
        </div>
      )}
      {selected && (
        <ReviewModal
          detail={selected}
          decision={decision}
          reason={reason}
          notes={notes}
          isSaving={isSaving}
          onDecision={setDecision}
          onReason={setReason}
          onNotes={setNotes}
          onSave={saveDecision}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <Icon className={`mb-3 h-6 w-6 ${color}`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[status]}`}>
      {labels[status]}
    </span>
  );
}

function ReviewModal({
  detail,
  decision,
  reason,
  notes,
  isSaving,
  onDecision,
  onReason,
  onNotes,
  onSave,
  onClose,
}: {
  detail: VerificationDetail;
  decision: "approve" | "reject" | "request-resubmission";
  reason: string;
  notes: string;
  isSaving: boolean;
  onDecision: (value: "approve" | "reject" | "request-resubmission") => void;
  onReason: (value: string) => void;
  onNotes: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { verification, user } = detail;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto my-6 max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Identity review</h2>
            <p className="text-sm text-gray-600">
              {user ? `${user.firstName} ${user.lastName} · ${user.email}` : "User unavailable"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close review" className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <section className="rounded-xl border p-5">
              <h3 className="mb-3 font-bold">Customer information</h3>
              <dl className="space-y-2 text-sm">
                <Info label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
                <Info label="Phone" value={user?.phone || "—"} />
                <Info label="Country" value={user?.country || "—"} />
                <Info label="Address" value={[user?.address, user?.addressLine2, user?.city, user?.stateRegion, user?.postalCode].filter(Boolean).join(", ") || "—"} />
                {user?.digitalAddress && <Info label="Digital address" value={user.digitalAddress} />}
              </dl>
            </section>
            <section className="rounded-xl border p-5">
              <h3 className="mb-3 font-bold">Verification metadata</h3>
              <dl className="space-y-2 text-sm">
                <Info label="Status" value={labels[verification.status]} />
                <Info label="Document" value={labels[verification.documentType] || verification.documentType} />
                <Info label="Document number" value={`Ending ${verification.documentNumberLast4}`} />
                <Info label="Selfie source" value={verification.selfieCaptureMethod} />
                <Info label="Automated liveness" value="Not configured — manual comparison required" />
                <Info label="Submitted" value={new Date(verification.submittedAt).toLocaleString()} />
              </dl>
            </section>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <PrivateFile title="Document front" url={verification.files.documentFront} contentType={verification.files.documentFrontType} />
              {verification.files.documentBack && <PrivateFile title="Document back" url={verification.files.documentBack} contentType={verification.files.documentBackType} />}
              <PrivateFile title="Selfie" url={verification.files.selfie} contentType={verification.files.selfieType} />
            </div>

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="mb-3 font-bold text-blue-950">Review decision</h3>
              <select
                className="mb-4 h-11 w-full rounded-md border border-blue-200 bg-white px-3"
                value={decision}
                onChange={(event) => onDecision(event.target.value as typeof decision)}
              >
                <option value="approve">Approve identity</option>
                <option value="request-resubmission">Request resubmission</option>
                <option value="reject">Reject identity</option>
              </select>
              {decision !== "approve" && (
                <div className="mb-4">
                  <label htmlFor="reviewReason" className="mb-2 block text-sm font-semibold">Customer-visible reason *</label>
                  <textarea id="reviewReason" rows={3} maxLength={500} className="w-full rounded-md border border-gray-300 p-3" value={reason} onChange={(event) => onReason(event.target.value)} />
                </div>
              )}
              <div>
                <label htmlFor="reviewNotes" className="mb-2 block text-sm font-semibold">Internal review notes</label>
                <textarea id="reviewNotes" rows={3} maxLength={1000} className="w-full rounded-md border border-gray-300 p-3" value={notes} onChange={(event) => onNotes(event.target.value)} />
              </div>
              <p className="mt-3 text-xs text-blue-800">The decision, reviewer, notes, and file access are recorded in the audit log. Documents are scheduled for deletion using the configured retention period.</p>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t p-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={isSaving} onClick={onSave} className="bg-[#315694] text-white hover:bg-[#262262]">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save decision"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium capitalize text-gray-900">{value}</dd>
    </div>
  );
}

function PrivateFile({
  title,
  url,
  contentType,
}: {
  title: string;
  url: string | null;
  contentType?: string;
}) {
  if (!url) {
    return <div className="rounded-xl border p-4 text-sm text-gray-500">{title}: unavailable or purged</div>;
  }
  const isPdf = contentType === "application/pdf";
  return (
    <figure className="overflow-hidden rounded-xl border bg-gray-50">
      <figcaption className="border-b bg-white px-4 py-3 font-semibold">{title}</figcaption>
      {isPdf ? (
        <iframe src={url} title={title} className="h-72 w-full" />
      ) : (
        // This authenticated same-origin route cannot be optimized by the public Next image pipeline.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="h-72 w-full object-contain" />
      )}
      <a href={url} target="_blank" rel="noreferrer" className="block border-t bg-white px-4 py-2 text-sm font-semibold text-[#315694]">
        Open securely
      </a>
    </figure>
  );
}

