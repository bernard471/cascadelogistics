import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { consumeRateLimit, ensureSecurityIndexes } from "@/lib/database-security";
import { createOpaqueToken, getRequestIp, hashOpaqueToken } from "@/lib/identity-security";
import {
  normalizeEmail,
  normalizeUsername,
  registrationAttemptSchema,
} from "@/lib/registration-validation";
import type { RegistrationAttempt } from "@/models/RegistrationAttempt";
import type { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const parsed = registrationAttemptSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration details" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensureSecurityIndexes(db);

    const ipAddress = getRequestIp(request);
    const rateLimit = await consumeRateLimit(db, `registration-attempt:${ipAddress}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // reCAPTCHA is intentionally disabled for now. The per-IP registration
    // rate limit above remains the active automated-abuse control.

    const emailNormalized = normalizeEmail(parsed.data.email);
    const usernameNormalized = normalizeUsername(parsed.data.username);
    const users = db.collection<User>("users");
    const existingUser = await users.findOne({
      $or: [
        { emailNormalized },
        { usernameNormalized },
        { email: emailNormalized },
        { username: usernameNormalized },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email or username already exists" },
        { status: 409 }
      );
    }

    const attemptToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const attempt: RegistrationAttempt = {
      tokenHash: hashOpaqueToken(attemptToken),
      emailNormalized,
      usernameNormalized,
      uploads: {},
      createdAt: new Date(),
      expiresAt,
      deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress,
    };

    const result = await db.collection<RegistrationAttempt>("registration_attempts").insertOne(attempt);

    return NextResponse.json({
      attemptId: result.insertedId.toString(),
      attemptToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Create registration attempt error:", error);
    return NextResponse.json(
      { error: "Unable to start secure registration. Please try again." },
      { status: 500 }
    );
  }
}
