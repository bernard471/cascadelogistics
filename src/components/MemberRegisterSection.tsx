"use client";

import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Mail,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IdentityDocumentType =
  | "ghana-card"
  | "passport"
  | "drivers-licence"
  | "residence-permit";
type IdentityFileKind = "documentFront" | "documentBack" | "selfie";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  address: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  country: string;
  postalCode: string;
  digitalAddress: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  termsAccepted: boolean;
  identityConsentAccepted: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
  address: "",
  addressLine2: "",
  city: "",
  stateRegion: "",
  country: "Ghana",
  postalCode: "",
  digitalAddress: "",
  documentType: "ghana-card",
  documentNumber: "",
  termsAccepted: false,
  identityConsentAccepted: false,
};

const steps = [
  { number: 1, label: "Account", icon: Mail },
  { number: 2, label: "Address", icon: FileCheck2 },
  { number: 3, label: "Identity", icon: ShieldCheck },
];

const IDENTITY_UPLOAD_TIMEOUT_MS = 60_000;

const documentLabels: Record<IdentityDocumentType, string> = {
  "ghana-card": "Ghana Card",
  passport: "Passport",
  "drivers-licence": "Driver’s licence",
  "residence-permit": "Residence permit",
};

function isGhana(country: string) {
  return ["ghana", "gh"].includes(country.trim().toLowerCase());
}

function requiresDocumentBack(type: IdentityDocumentType) {
  return type !== "passport";
}

function safeFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "upload"
  );
}

function SelfiePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  if (!url) return null;
  // A user-selected local preview is intentionally rendered with a normal img element.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Selfie preview" className="h-40 w-40 rounded-xl object-cover" />;
}

export default function MemberRegisterSection() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<Partial<Record<IdentityFileKind, File>>>({});
  const [selfieCaptureMethod, setSelfieCaptureMethod] = useState<"camera" | "upload">("camera");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOpen || !video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      setError("The camera opened but the preview could not start. Please try again or upload a selfie.");
    });

    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [cameraOpen]);

  const setField = (name: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    setError("");
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!form.firstName.trim()) nextErrors.firstName = "First name is required";
      if (!form.lastName.trim()) nextErrors.lastName = "Last name is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email";
      if (!/^\+?[0-9 ()-]{8,20}$/.test(form.phone)) nextErrors.phone = "Enter a valid phone number";
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(form.username)) {
        nextErrors.username = "Use 3–30 letters, numbers, underscores, or hyphens";
      }
      if (
        form.password.length < 10 ||
        !/[a-z]/.test(form.password) ||
        !/[A-Z]/.test(form.password) ||
        !/\d/.test(form.password) ||
        !/[^A-Za-z0-9]/.test(form.password)
      ) {
        nextErrors.password = "Use 10+ characters with upper, lower, number, and symbol";
      }
      if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
      if (!form.termsAccepted) nextErrors.termsAccepted = "Accept the terms and privacy policy";
    }

    if (targetStep === 2) {
      if (form.address.trim().length < 5) nextErrors.address = "Enter your physical address";
      if (!form.city.trim()) nextErrors.city = "City is required";
      if (!form.stateRegion.trim()) nextErrors.stateRegion = "State or region is required";
      if (!form.country.trim()) nextErrors.country = "Country is required";
      if (isGhana(form.country) && !form.digitalAddress.trim()) {
        nextErrors.digitalAddress = "GhanaPost GPS/digital address is required";
      }
    }

    if (targetStep === 3) {
      if (form.documentNumber.trim().length < 4) nextErrors.documentNumber = "Document number is required";
      if (!files.documentFront) nextErrors.documentFront = "Upload the front/photo page";
      if (requiresDocumentBack(form.documentType) && !files.documentBack) {
        nextErrors.documentBack = "Upload the back of this document";
      }
      if (!files.selfie) nextErrors.selfie = "Capture or upload a clear selfie";
      if (!form.identityConsentAccepted) nextErrors.identityConsentAccepted = "Identity-verification consent is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const moveNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(3, current + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setError("Camera access was unavailable. You can upload a recent, unedited selfie instead.");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFiles((current) => ({
          ...current,
          selfie: new File([blob], "selfie-camera.jpg", { type: "image/jpeg" }),
        }));
        setSelfieCaptureMethod("camera");
        setErrors((current) => ({ ...current, selfie: "" }));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const setFile = (kind: IdentityFileKind, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, [kind]: "Maximum file size is 5 MB" }));
      return;
    }
    setFiles((current) => ({ ...current, [kind]: file }));
    setErrors((current) => ({ ...current, [kind]: "" }));
    if (kind === "selfie") setSelfieCaptureMethod("upload");
  };

  const uploadIdentityFile = async (
    attemptId: string,
    attemptToken: string,
    kind: IdentityFileKind,
    file: File
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      IDENTITY_UPLOAD_TIMEOUT_MS
    );

    try {
      return await upload(
        `identity-verifications/${attemptId}/${kind}/${safeFileName(file.name)}`,
        file,
        {
          abortSignal: controller.signal,
          access: "private",
          handleUploadUrl: "/api/auth/registration-upload",
          clientPayload: JSON.stringify({ attemptToken, kind }),
        }
      );
    } catch (uploadError) {
      if (controller.signal.aborted) {
        throw new Error(
          "The secure identity upload timed out. Please check your connection and try again."
        );
      }
      throw uploadError;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStep(3) || !files.documentFront || !files.selfie) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      setUploadProgress("Securing your registration session…");
      const attemptResponse = await fetch("/api/auth/registration-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
        }),
      });
      const attempt = await attemptResponse.json();
      if (!attemptResponse.ok) throw new Error(attempt.error || "Could not start registration");

      setUploadProgress("Uploading identity documents securely…");
      const [documentFront, documentBack, selfie] = await Promise.all([
        uploadIdentityFile(attempt.attemptId, attempt.attemptToken, "documentFront", files.documentFront),
        files.documentBack
          ? uploadIdentityFile(attempt.attemptId, attempt.attemptToken, "documentBack", files.documentBack)
          : Promise.resolve(undefined),
        uploadIdentityFile(attempt.attemptId, attempt.attemptToken, "selfie", files.selfie),
      ]);

      setUploadProgress("Creating your protected account…");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attemptToken: attempt.attemptToken,
          documentFront: { pathname: documentFront.pathname },
          documentBack: documentBack ? { pathname: documentBack.pathname } : undefined,
          selfie: { pathname: selfie.pathname },
          selfieCaptureMethod,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed");

      setSuccess(result.message);
      setUploadProgress("");
      stopCamera();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Registration failed");
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const fieldError = (name: string) =>
    errors[name] ? <p className="mt-1 text-sm text-red-600">{errors[name]}</p> : null;

  if (success) {
    return (
      <section className="flex min-h-[600px] items-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-xl lg:p-12">
            <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-green-600" />
            <h1 className="mb-3 text-3xl font-bold text-gray-900">Registration submitted</h1>
            <p className="mb-4 text-gray-700">{success}</p>
            <div className="mb-7 rounded-xl bg-blue-50 p-4 text-left text-sm text-blue-900">
              <p className="font-semibold">What happens next?</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Open the verification link sent to your email.</li>
                <li>Our authorized team reviews your ID and selfie.</li>
                <li>You receive an email when the account is approved.</li>
              </ol>
            </div>
            <Link href="/member-login">
              <Button className="bg-[#315694] px-7 py-5 text-white hover:bg-[#262262]">
                Go to sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[700px] bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 lg:py-20">
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl lg:p-10">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">Create your account</h1>
            <p className="text-gray-600">Secure registration for Cascade Logistics</p>
          </div>

          <ol className="mb-10 grid grid-cols-3 gap-2" aria-label="Registration progress">
            {steps.map((item) => {
              const Icon = item.icon;
              const active = step === item.number;
              const completed = step > item.number;
              return (
                <li key={item.number} aria-current={active ? "step" : undefined}>
                  <div
                    className={`flex flex-col items-center rounded-xl border px-2 py-3 text-center ${
                      active
                        ? "border-[#315694] bg-blue-50 text-[#315694]"
                        : completed
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    <span className="mt-1 text-xs font-semibold sm:text-sm">
                      {item.number}. {item.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {error && (
            <div role="alert" className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <fieldset className="space-y-5">
                <legend className="mb-2 text-xl font-bold text-gray-900">Account and contact details</legend>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block font-semibold text-gray-700">First name *</label>
                    <Input id="firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                    {fieldError("firstName")}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-2 block font-semibold text-gray-700">Last name *</label>
                    <Input id="lastName" autoComplete="family-name" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                    {fieldError("lastName")}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block font-semibold text-gray-700">Email *</label>
                    <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                    {fieldError("email")}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block font-semibold text-gray-700">Phone number *</label>
                    <Input id="phone" type="tel" autoComplete="tel" placeholder="+233…" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                    {fieldError("phone")}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="username" className="mb-2 block font-semibold text-gray-700">Username *</label>
                    <Input id="username" autoComplete="username" value={form.username} onChange={(e) => setField("username", e.target.value)} />
                    {fieldError("username")}
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-2 block font-semibold text-gray-700">Password *</label>
                    <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
                    {fieldError("password")}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block font-semibold text-gray-700">Confirm password *</label>
                    <Input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} />
                    {fieldError("confirmPassword")}
                  </div>
                </div>
                <p className="text-sm text-gray-500">Use at least 10 characters with uppercase, lowercase, a number, and a symbol.</p>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={form.termsAccepted} onChange={(e) => setField("termsAccepted", e.target.checked)} />
                  <span>
                    I agree to the <Link className="font-semibold text-[#315694] underline" href="/terms">Terms</Link> and{" "}
                    <Link className="font-semibold text-[#315694] underline" href="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {fieldError("termsAccepted")}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="space-y-5">
                <legend className="mb-2 text-xl font-bold text-gray-900">Residential address</legend>
                <p className="text-sm text-gray-600">International customers can enter their normal residential address. Ghana addresses also require a GhanaPost GPS code.</p>
                <div>
                  <label htmlFor="country" className="mb-2 block font-semibold text-gray-700">Country *</label>
                  <Input id="country" autoComplete="country-name" value={form.country} onChange={(e) => setField("country", e.target.value)} />
                  {fieldError("country")}
                </div>
                <div>
                  <label htmlFor="address" className="mb-2 block font-semibold text-gray-700">Physical address *</label>
                  <Input id="address" autoComplete="address-line1" value={form.address} onChange={(e) => setField("address", e.target.value)} />
                  {fieldError("address")}
                </div>
                <div>
                  <label htmlFor="addressLine2" className="mb-2 block font-semibold text-gray-700">Apartment, suite, or landmark</label>
                  <Input id="addressLine2" autoComplete="address-line2" value={form.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="mb-2 block font-semibold text-gray-700">City *</label>
                    <Input id="city" autoComplete="address-level2" value={form.city} onChange={(e) => setField("city", e.target.value)} />
                    {fieldError("city")}
                  </div>
                  <div>
                    <label htmlFor="stateRegion" className="mb-2 block font-semibold text-gray-700">State or region *</label>
                    <Input id="stateRegion" autoComplete="address-level1" value={form.stateRegion} onChange={(e) => setField("stateRegion", e.target.value)} />
                    {fieldError("stateRegion")}
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="mb-2 block font-semibold text-gray-700">Postal code</label>
                    <Input id="postalCode" autoComplete="postal-code" value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} />
                  </div>
                  {isGhana(form.country) && (
                    <div>
                      <label htmlFor="digitalAddress" className="mb-2 block font-semibold text-gray-700">GhanaPost GPS / digital address *</label>
                      <Input id="digitalAddress" placeholder="GA-123-4567" value={form.digitalAddress} onChange={(e) => setField("digitalAddress", e.target.value.toUpperCase())} />
                      {fieldError("digitalAddress")}
                    </div>
                  )}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="space-y-6">
                <legend className="mb-2 text-xl font-bold text-gray-900">Identity verification</legend>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  Your documents are stored in private Blob storage and are available only to authorized administrators. A selfie is manually compared with your ID; this is not automated liveness testing.
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="documentType" className="mb-2 block font-semibold text-gray-700">Document type *</label>
                    <select
                      id="documentType"
                      className="h-11 w-full rounded-md border border-gray-300 px-3"
                      value={form.documentType}
                      onChange={(e) => {
                        setField("documentType", e.target.value);
                        if (e.target.value === "passport") {
                          setFiles((current) => ({ ...current, documentBack: undefined }));
                        }
                      }}
                    >
                      {Object.entries(documentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="documentNumber" className="mb-2 block font-semibold text-gray-700">Document number *</label>
                    <Input id="documentNumber" autoComplete="off" value={form.documentNumber} onChange={(e) => setField("documentNumber", e.target.value)} />
                    <p className="mt-1 text-xs text-gray-500">Only a protected hash and the final four characters are stored outside the document image.</p>
                    {fieldError("documentNumber")}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FileInput
                    id="documentFront"
                    label={form.documentType === "passport" ? "Passport photo page *" : "Document front *"}
                    file={files.documentFront}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(file) => setFile("documentFront", file)}
                  />
                  {requiresDocumentBack(form.documentType) && (
                    <FileInput
                      id="documentBack"
                      label="Document back *"
                      file={files.documentBack}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(file) => setFile("documentBack", file)}
                    />
                  )}
                </div>
                {fieldError("documentFront")}
                {fieldError("documentBack")}

                <div className="rounded-xl border border-gray-200 p-5">
                  <h2 className="mb-2 font-bold text-gray-900">Selfie verification *</h2>
                  <p className="mb-4 text-sm text-gray-600">Use a well-lit, recent photo without sunglasses, filters, or another person in frame.</p>
                  {cameraOpen ? (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay muted playsInline className="max-h-80 w-full rounded-xl bg-black object-cover" />
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={captureSelfie}><Camera className="mr-2 h-4 w-4" />Capture selfie</Button>
                        <Button type="button" variant="outline" onClick={stopCamera}>Cancel camera</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <Button type="button" onClick={startCamera}><Camera className="mr-2 h-4 w-4" />Open camera</Button>
                      {/*
                      <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                        <Upload className="mr-2 h-4 w-4" />Upload instead
                        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile("selfie", e.target.files?.[0])} />
                      </label>
                      */}
                      {files.selfie && <SelfiePreview file={files.selfie} />}
                    </div>
                  )}
                  {fieldError("selfie")}
                </div>

                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={form.identityConsentAccepted} onChange={(e) => setField("identityConsentAccepted", e.target.checked)} />
                  <span>I consent to Cascade Logistics securely processing my identity document and selfie for account verification and fraud prevention.</span>
                </label>
                {fieldError("identityConsentAccepted")}
                {/* reCAPTCHA is intentionally disabled. The registration rate
                    limit and manual identity/selfie review remain active. */}
              </fieldset>
            )}

            {uploadProgress && (
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-blue-50 p-4 text-blue-900" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploadProgress}
              </div>
            )}

            <div className="mt-9 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
              {step > 1 ? (
                <Button type="button" variant="outline" disabled={isLoading} onClick={() => setStep((current) => current - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Back
                </Button>
              ) : <span />}
              {step < 3 ? (
                <Button type="button" onClick={moveNext} className="bg-[#315694] text-white hover:bg-[#262262]">
                  Continue<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading} className="bg-[#315694] px-6 text-white hover:bg-[#262262]">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><ShieldCheck className="mr-2 h-4 w-4" />Submit registration</>}
                </Button>
              )}
            </div>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Already registered? <Link href="/member-login" className="font-semibold text-[#315694] underline">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function FileInput({
  id,
  label,
  file,
  accept,
  onChange,
}: {
  id: string;
  label: string;
  file?: File;
  accept: string;
  onChange: (file?: File) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold text-gray-700">{label}</label>
      <label htmlFor={id} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 text-center hover:border-[#315694] hover:bg-blue-50">
        {file ? (
          <>
            <FileCheck2 className="mb-2 h-6 w-6 text-green-600" />
            <span className="max-w-full truncate text-sm font-semibold text-gray-800">{file.name}</span>
            <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-6 w-6 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Choose a clear image or PDF</span>
            <span className="text-xs text-gray-500">JPEG, PNG, WebP or PDF — maximum 5 MB</span>
          </>
        )}
        <input id={id} className="sr-only" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0])} />
      </label>
    </div>
  );
}
