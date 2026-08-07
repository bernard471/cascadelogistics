import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ObjectId } from "mongodb";

import {
  runPhase2Migration,
  verifyPhase2ShipmentLookups,
} from "../src/lib/partner-platform/migration.ts";
import { getRequiredPartnerIndexNames } from "../src/lib/partner-platform/indexes.ts";
import { generatePublicId } from "../src/lib/partner-platform/public-id.ts";
import {
  createApiClient,
  createApiCredential,
  createOrganization,
  getApiClientByPublicIdForOrganization,
  getPartnerCustomerForOrganization,
  PartnerRepositoryError,
  upsertPartnerCustomer,
} from "../src/lib/partner-platform/repositories.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

test("Phase 2 migration and tenant repositories reconcile in an isolated database", async () => {
  const databaseName = `cascade_phase2_test_${randomUUID().replaceAll("-", "")}`;
  const db = new InMemoryMongoDatabase(databaseName);

    const organization = await createOrganization(db, {
      name: "Phase 2 Test Partner",
      slug: `phase-2-${randomUUID().slice(0, 8)}`,
      status: "active",
    });
    const otherOrganization = await createOrganization(db, {
      name: "Other Test Partner",
      slug: `other-${randomUUID().slice(0, 8)}`,
      status: "active",
    });
    const apiClient = await createApiClient(db, organization._id, {
      name: "Test Application",
      environmentAccess: ["test"],
      scopes: ["shipments:read"],
    });
    const customer = await upsertPartnerCustomer(db, organization._id, {
      externalCustomerId: "customer-001",
      profile: { name: "Partner Customer", email: "partner@example.com" },
    });

    await db.collection("shipments").insertMany([
      {
        trackingId: "CLLPHASE2001",
        userId: new ObjectId().toString(),
        senderName: "Dashboard Customer",
        senderEmail: "dashboard@example.com",
        timeline: [{ status: "Order Placed" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        trackingId: "CLLPHASE2002",
        userId: new ObjectId().toString(),
        senderName: "Admin Customer",
        senderEmail: "admin@example.com",
        timeline: [{ status: "Arrived at Warehouse" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        publicId: generatePublicId("shipment"),
        trackingId: "CLLPHASE2003",
        createdVia: "partner_api",
        environment: "test",
        organizationId: organization._id,
        apiClientId: apiClient._id,
        externalReference: "partner-reference-001",
        externalCustomerId: customer.externalCustomerId,
        senderName: "Partner Customer",
        senderEmail: "partner@example.com",
        timeline: [{ status: "Order Placed" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const first = await runPhase2Migration({
      db,
      databaseName,
      dryRun: false,
    });
    assert.equal(first.before.shipments, 3);
    assert.equal(first.after.shipments, 3);
    assert.equal(first.updated, 2);
    assert.equal(first.indexesEnsured, getRequiredPartnerIndexNames().length);
    assert.equal(first.reconciled, true);
    assert.equal(first.errors.length, 0);

    const second = await runPhase2Migration({
      db,
      databaseName,
      dryRun: false,
    });
    assert.equal(second.planned, 0);
    assert.equal(second.updated, 0);
    assert.equal(second.unchanged, 3);
    assert.equal(second.reconciled, true);

    const lookups = await verifyPhase2ShipmentLookups(db);
    assert.deepEqual(lookups, {
      checked: 3,
      byId: 3,
      byTrackingId: 3,
      byPublicId: 3,
      reconciled: true,
    });

    assert.ok(
      await getApiClientByPublicIdForOrganization(
        db,
        organization._id,
        apiClient.publicId,
      ),
    );
    assert.equal(
      await getApiClientByPublicIdForOrganization(
        db,
        otherOrganization._id,
        apiClient.publicId,
      ),
      null,
    );
    assert.ok(
      await getPartnerCustomerForOrganization(
        db,
        organization._id,
        customer.publicId,
      ),
    );
    assert.equal(
      await getPartnerCustomerForOrganization(
        db,
        otherOrganization._id,
        customer.publicId,
      ),
      null,
    );

    await assert.rejects(
      createApiCredential(db, organization._id, apiClient._id, {
        environment: "live",
        keyPrefix: "csl_live_denied",
        secretHash: "a".repeat(64),
        createdBy: "phase2-test",
      }),
      (error) =>
        error instanceof PartnerRepositoryError &&
        error.code === "environment_denied",
    );
    await createApiCredential(db, organization._id, apiClient._id, {
      environment: "test",
      keyPrefix: `csl_test_${randomUUID().slice(0, 12)}`,
      secretHash: "b".repeat(64),
      createdBy: "phase2-test",
    });

    const partnerShipment = await db.collection("shipments").findOne({
      trackingId: "CLLPHASE2003",
    });
    assert.equal(partnerShipment?.userId, undefined);
    assert.equal(partnerShipment?.senderName, "Partner Customer");

    await assert.rejects(
      db.collection("shipments").insertOne({
        ...partnerShipment,
        _id: new ObjectId(),
        trackingId: "CLLPHASE2004",
      }),
      (error) => error?.code === 11000,
    );

    await assert.rejects(
      db.collection("shipments").insertOne({
        ...partnerShipment,
        _id: new ObjectId(),
        publicId: generatePublicId("shipment"),
        trackingId: "CLLPHASE2004B",
      }),
      (error) => error?.code === 11000,
    );

    await db.collection("shipments").insertOne({
      publicId: generatePublicId("shipment"),
      trackingId: "CLLPHASE2005",
      createdVia: "partner_api",
      environment: "test",
      organizationId: otherOrganization._id,
      externalReference: "partner-reference-001",
      senderName: "Other Organization Customer",
      senderEmail: "other@example.com",
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  assert.match(databaseName, /^cascade_phase2_test_[a-f0-9]{32}$/);
});
