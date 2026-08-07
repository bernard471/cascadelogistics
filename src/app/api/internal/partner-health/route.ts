import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getPartnerOperationalHealth } from "@/lib/partner-platform/operations";
export const runtime = "nodejs";
export async function GET(request: Request) { if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const client=await clientPromise; const health=await getPartnerOperationalHealth(client.db("guangzhou")); return NextResponse.json(health,{status:health.alerts.some((item)=>item.severity==="critical")?503:200,headers:{"Cache-Control":"no-store"}}); }
