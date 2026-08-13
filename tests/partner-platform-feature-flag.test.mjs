import assert from "node:assert/strict";
import test from "node:test";

import {
  isPartnerPlatformEnabled,
  partnerPlatformEnvironmentVariable,
} from "../src/lib/partner-platform/feature.ts";

test("partner platform is archived by default", () => {
  assert.equal(isPartnerPlatformEnabled({}), false);
});

test("partner platform is enabled only by an explicit true value", () => {
  assert.equal(
    isPartnerPlatformEnabled({ [partnerPlatformEnvironmentVariable]: "true" }),
    true,
  );
  assert.equal(
    isPartnerPlatformEnabled({ [partnerPlatformEnvironmentVariable]: " TRUE " }),
    true,
  );
  assert.equal(
    isPartnerPlatformEnabled({ [partnerPlatformEnvironmentVariable]: "false" }),
    false,
  );
  assert.equal(
    isPartnerPlatformEnabled({ [partnerPlatformEnvironmentVariable]: "1" }),
    false,
  );
});
