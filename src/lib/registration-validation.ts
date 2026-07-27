import { z } from "zod";

export const IDENTITY_DOCUMENT_TYPES = [
  "ghana-card",
  "passport",
  "drivers-licence",
  "residence-permit",
] as const;

const nameSchema = z
  .string()
  .trim()
  .min(1, "This field is required")
  .max(80, "Must be 80 characters or fewer")
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u, "Use letters, spaces, apostrophes, or hyphens only");

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const leadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `${leadingPlus ? "+" : ""}${digits}`;
}

export function isGhana(country: string) {
  return ["ghana", "gh"].includes(country.trim().toLowerCase());
}

export const registrationAttemptSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can contain letters, numbers, underscores, and hyphens"),
  // reCAPTCHA can be restored here later if bot traffic justifies it.
});

const uploadedBlobSchema = z.object({
  pathname: z.string().min(1).max(700),
});

export const registrationSubmissionSchema = z
  .object({
    attemptToken: z.string().min(32),
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.string().trim().email("Enter a valid email address").max(254),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid international phone number")),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128)
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/\d/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    address: z.string().trim().min(5).max(180),
    addressLine2: z.string().trim().max(180).optional().default(""),
    city: z.string().trim().min(2).max(100),
    stateRegion: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(30).optional().default(""),
    digitalAddress: z.string().trim().max(40).optional().default(""),
    documentType: z.enum(IDENTITY_DOCUMENT_TYPES),
    documentNumber: z.string().trim().min(4).max(60),
    documentFront: uploadedBlobSchema,
    documentBack: uploadedBlobSchema.optional(),
    selfie: uploadedBlobSchema,
    selfieCaptureMethod: z.enum(["camera", "upload"]),
    termsAccepted: z.literal(true),
    identityConsentAccepted: z.literal(true),
  })
  .superRefine((data, context) => {
    if (isGhana(data.country) && !data.digitalAddress) {
      context.addIssue({
        code: "custom",
        path: ["digitalAddress"],
        message: "GhanaPost GPS/digital address is required for Ghana addresses",
      });
    }

    if (
      ["ghana-card", "drivers-licence", "residence-permit"].includes(data.documentType) &&
      !data.documentBack
    ) {
      context.addIssue({
        code: "custom",
        path: ["documentBack"],
        message: "The back of this document is required",
      });
    }
  });

export type RegistrationSubmission = z.infer<typeof registrationSubmissionSchema>;
