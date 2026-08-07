import assert from "node:assert/strict";
import test from "node:test";

import { getRequiredPartnerIndexNames } from "../src/lib/partner-platform/indexes.ts";
import {
  assertPhase2TestDatabase,
  buildLegacyShipmentBackfill,
  inferLegacyShipmentCreatedVia,
} from "../src/lib/partner-platform/migration.ts";
import {
  generatePublicId,
  isPublicId,
} from "../src/lib/partner-platform/public-id.ts";
import {
  apiClientCreateSchema,
  organizationCreateSchema,
} from "../src/lib/partner-platform/schemas.ts";

test("public IDs are opaque, prefixed, and type-checkable", () => {
  const id = generatePublicId("shipment", () => Buffer.alloc(12, 7));
  assert.equal(id.startsWith("shp_"), true);
  assert.equal(isPublicId(id, "shipment"), true);
  assert.equal(isPublicId(id, "organization"), false);
});

test("tenant schemas apply conservative first-release defaults", () => {
  const organization = organizationCreateSchema.parse({
    name: "Example Partner",
    slug: "example-partner",
  });
  assert.equal(organization.status, "pending");
  assert.equal(organization.settings.customerEmailMode, "partner");
  assert.equal(organization.settings.shipmentVisibility, "organization");
  assert.equal(organization.limits.requestsPerMinute, 60);

  const client = apiClientCreateSchema.parse({ name: "Warehouse App" });
  assert.deepEqual(client.environmentAccess, ["test"]);
  assert.deepEqual(client.scopes, []);
});

test("migration guard refuses the live database and ambiguous names", () => {
  assert.throws(() => assertPhase2TestDatabase("guangzhou"));
  assert.throws(() => assertPhase2TestDatabase("partner_data"));
  assert.doesNotThrow(() =>
    assertPhase2TestDatabase("cascade_phase2_test_fixture"),
  );
  assert.doesNotThrow(() => assertPhase2TestDatabase("partner_sandbox"));
});

test("legacy migration inference distinguishes dashboard and admin records", () => {
  assert.equal(
    inferLegacyShipmentCreatedVia({ timeline: [{ status: "Order Placed" }] }),
    "dashboard",
  );
  assert.equal(
    inferLegacyShipmentCreatedVia({
      timeline: [{ status: "Arrived at Warehouse" }],
    }),
    "admin",
  );
  assert.equal(
    inferLegacyShipmentCreatedVia({ organizationId: "org-placeholder" }),
    "partner_api",
  );
});

test("legacy shipment backfill is additive and idempotent", () => {
  const legacy = {
    userId: "cascade-user-1",
    trackingId: "CLL000000001",
    timeline: [{ status: "Order Placed" }],
  };
  const first = buildLegacyShipmentBackfill(legacy, "shp_fixedpublicid1234");
  assert.deepEqual(first, {
    publicId: "shp_fixedpublicid1234",
    environment: "live",
    createdVia: "dashboard",
    cascadeUserId: "cascade-user-1",
    createdByPrincipal: { type: "user", id: "cascade-user-1" },
  });
  assert.deepEqual(buildLegacyShipmentBackfill({ ...legacy, ...first }), {});
});

test("required index catalog has stable unique names", () => {
  const names = getRequiredPartnerIndexNames();
  assert.equal(names.length > 10, true);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.includes("shipments_public_id_unique_partial"));
  assert.ok(names.includes("partner_customers_org_external_customer_unique"));
});
