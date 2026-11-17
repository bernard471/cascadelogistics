import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Document, Filter } from "mongodb";
import { getEmailFrom, getEmailTransporter } from "@/lib/email";
import { normalizeSearchTerm, type SearchMatchType } from "@/lib/search/text-search";
import { searchUsers, USER_LIST_PROJECTION } from "@/lib/search/user-search";

function readInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

// GET - List or search users (Admin/Staff). `search` returns exact matches
// first, then similar spellings, each tagged with `matchType`.
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = normalizeSearchTerm(searchParams.get("search"));
    const limit = readInteger(searchParams.get("limit"), 100, 1, 200);
    const skip = readInteger(searchParams.get("skip"), 0, 0, 1_000_000);

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");
    const shipmentsCollection = db.collection("shipments");
    const visibleUserRoles: User["role"][] = ["user", "admin", "staff"];
    const visibleUserFilter = { role: { $in: visibleUserRoles } };

    const baseFilter: Filter<Document> = {
      role: role && (visibleUserRoles as string[]).includes(role)
        ? role
        : { $in: visibleUserRoles },
    };
    if (status && status !== "all") {
      baseFilter.status = status;
    }

    let users: Document[];
    let total: number;
    let searchSummary: { term: string; exactCount: number; similarCount: number } | undefined;
    const matchTypes = new Map<string, SearchMatchType>();

    if (search) {
      // Exact matches first, then similar spellings; the page is cut from that ranking.
      const result = await searchUsers(db, { term: search, baseFilter });
      total = result.matches.length;
      const page = result.matches.slice(skip, skip + limit);
      page.forEach((match) => matchTypes.set(match.id.toString(), match.matchType));
      const found = page.length
        ? await usersCollection
            .find({ _id: { $in: page.map((match) => match.id) } }, { projection: USER_LIST_PROJECTION })
            .toArray()
        : [];
      const byId = new Map(found.map((user) => [user._id.toString(), user]));
      users = page.flatMap((match) => byId.get(match.id.toString()) || []);
      searchSummary = {
        term: search,
        exactCount: result.exactCount,
        similarCount: result.similarCount,
      };
    } else {
      [users, total] = await Promise.all([
        usersCollection
          .find(baseFilter, { projection: USER_LIST_PROJECTION })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        usersCollection.countDocuments(baseFilter),
      ]);
    }

    // One query for the shipment counts of every user on this page.
    const userIds = users.map((user) => user._id.toString());
    const [shipmentCounts, statsTotal, active, suspended, pending] = await Promise.all([
      userIds.length
        ? shipmentsCollection
            .aggregate<{ _id: string; count: number }>([
              { $match: { userId: { $in: userIds } } },
              { $group: { _id: "$userId", count: { $sum: 1 } } },
            ])
            .toArray()
        : Promise.resolve([]),
      usersCollection.countDocuments(visibleUserFilter),
      usersCollection.countDocuments({ ...visibleUserFilter, status: "active" }),
      usersCollection.countDocuments({ ...visibleUserFilter, status: "suspended" }),
      usersCollection.countDocuments({ ...visibleUserFilter, status: "pending" }),
    ]);
    const shipmentCountByUser = new Map(shipmentCounts.map((row) => [row._id, row.count]));

    const usersWithShipments = users.map((user) => {
      const id = user._id.toString();
      const createdAt = new Date(user.createdAt);
      return {
        ...user,
        _id: id,
        totalShipments: shipmentCountByUser.get(id) || 0,
        registeredDate: Number.isNaN(createdAt.getTime())
          ? ""
          : createdAt.toISOString().split("T")[0],
        ...(matchTypes.has(id) ? { matchType: matchTypes.get(id) } : {}),
      };
    });

    return NextResponse.json(
      {
        users: usersWithShipments,
        stats: {
          total: statsTotal,
          active,
          suspended,
          pending
        },
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit),
        ...(searchSummary ? { search: searchSummary } : {}),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create a new user (Admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, username, password, role, status, emailVerified, phone } = body;

    if (role && !["user", "admin", "staff"].includes(role)) {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine email verification status
    const isEmailVerified = emailVerified === true;
    
    // Generate verification token only if email is not verified
    let verificationToken: string | undefined;
    let verificationTokenExpiry: Date | undefined;
    
    if (!isEmailVerified) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    const newUser: Omit<User, '_id'> = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active',
      phone: phone || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: isEmailVerified,
      verificationToken,
      verificationTokenExpiry
    };

    const result = await usersCollection.insertOne(newUser);

    // Send verification email only if email is not verified
    if (!isEmailVerified) {
      try {
        if (verificationToken) {
          const transporter = getEmailTransporter();

          const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
          const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #315694 0%, #262262 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                  .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                  .button { display: inline-block; padding: 12px 30px; background: #315694; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { background: #262262; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>Welcome to Cascade Logistics!</h2>
                  </div>
                  <div class="content">
                    <p>Hello ${firstName},</p>
                    <p>Your account has been created by an administrator. Welcome to Cascade Logistics!</p>
                    <p>To complete your registration, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                      <a href="${verificationUrl}" class="button" style="color: white;">Verify Email Address</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #315694;">${verificationUrl}</p>
                    <p><strong>This verification link will expire in 24 hours.</strong></p>
                    <p>Once verified, you'll be able to access all our shipping services and track your shipments.</p>
                    <p>Your login credentials:</p>
                    <ul>
                      <li><strong>Username:</strong> ${username}</li>
                      <li><strong>Email:</strong> ${email}</li>
                    </ul>
                    <p>If you didn't expect this email, please contact support.</p>
                  </div>
                  <div class="footer">
                    This email was sent from Cascade Logistics. Please do not reply to this email.<br>
                    Need help? Contact us at info@cascadelogistics.co
                  </div>
                </div>
              </body>
            </html>
          `;

          const textVersion = `
Hello ${firstName},

Your account has been created by an administrator. Welcome to Cascade Logistics!

To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

Once verified, you'll be able to access all our shipping services and track your shipments.

Your login credentials:
- Username: ${username}
- Email: ${email}

If you didn't expect this email, please contact support.

Best regards,
Cascade Logistics Team
          `;

          await transporter.sendMail({
            from: getEmailFrom(),
            to: email,
            subject: "Welcome to Cascade Logistics - Verify Your Email",
            text: textVersion,
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail user creation if email fails, but log it
      }
    }

    return NextResponse.json(
      { 
        message: isEmailVerified 
          ? "User created successfully with verified email" 
          : "User created successfully. Verification email has been sent.",
        userId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
