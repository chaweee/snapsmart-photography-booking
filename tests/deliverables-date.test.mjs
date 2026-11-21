import { test } from "node:test";
import assert from "node:assert/strict";
import { estimatedDeliverablesDate } from "../src/lib/deliverables.ts";

test("adds two calendar months", () => {
  assert.equal(estimatedDeliverablesDate("2026-11-14"), "2027-01-14");
  assert.equal(estimatedDeliverablesDate("2026-01-15"), "2026-03-15");
});

test("clamps the date at the end of the target month", () => {
  assert.equal(estimatedDeliverablesDate("2025-12-31"), "2026-02-28");
  assert.equal(estimatedDeliverablesDate("2027-12-31"), "2028-02-29");
});

test("rejects malformed or invalid dates", () => {
  assert.equal(estimatedDeliverablesDate("not a date"), "");
  assert.equal(estimatedDeliverablesDate("2026-02-30"), "");
});
