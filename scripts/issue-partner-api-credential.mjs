import { MongoClient } from "mongodb";

import { issuePartnerApiCredential } from "../src/lib/partner-platform/credentials.ts";
import { assertPhase2TestDatabase } from "../src/lib/partner-platform/migration.ts";
import {
  getApiClientByPublicIdForOrganization,
  getOrganizationByPublicId,
} from "../src/lib/partner-platform/repositories.ts";

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const databaseName = argument("database");
const organizationPublicId = argument("organization");
const applicationPublicId = argument("application");
const environment = argument("environment");
const actorId = argument("actor") || "phase3-local-operator";
const scopes = (argument("scopes") || "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);

if (!databaseName || !organizationPublicId || !applicationPublicId) {
  throw new Error(
    "Pass --database, --organization=org_..., and --application=app_...",
  );
}
if (environment !== "test" && environment !== "live") {
  throw new Error("Pass --environment=test or --environment=live");
}
if (scopes.length === 0) {
  throw new Error("Pass at least one comma-separated --scopes value");
}
assertPhase2TestDatabase(databaseName);
if (!process.env.MONGO) throw new Error("MONGO is required");
if (!process.env.PARTNER_API_KEY_PEPPER) {
  throw new Error("PARTNER_API_KEY_PEPPER is required");
}

const client = new MongoClient(process.env.MONGO);
try {
  await client.connect();
  const db = client.db(databaseName);
  const organization = await getOrganizationByPublicId(db, organizationPublicId);
  if (!organization?._id) throw new Error("Organization not found");
  const application = await getApiClientByPublicIdForOrganization(
    db,
    organization._id,
    applicationPublicId,
  );
  if (!application?._id) throw new Error("Application not found");

  const issued = await issuePartnerApiCredential({
    db,
    principal: {
      kind: "internal",
      userId: actorId,
      role: "super_admin",
    },
    organizationId: organization._id.toString(),
    apiClientId: application._id.toString(),
    environment,
    scopes,
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        warning: "Copy this API key now. It cannot be retrieved again.",
        apiKey: issued.apiKey,
        credential: issued.credential,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await client.close();
}
