import assert from "node:assert/strict";
import { test } from "node:test";
import { distribute, owedByMember } from "./split";

test("equal split remainder", () => {
  const parts = distribute(100, [1, 1, 1]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(parts.sort(), [33, 33, 34].sort());
});

test("equal among named, skipper omitted", () => {
  const owed = owedByMember(90, "equal", [
    { memberId: "a", weight: 1 },
    { memberId: "b", weight: 1 },
  ]);
  assert.equal(owed.get("a"), 45);
  assert.equal(owed.get("b"), 45);
  assert.equal(owed.has("c"), false);
});

test("exact must sum", () => {
  const owed = owedByMember(100, "exact", [
    { memberId: "a", weight: 70 },
    { memberId: "b", weight: 30 },
  ]);
  assert.equal(owed.get("a"), 70);
  assert.equal(owed.get("b"), 30);
});

test("percent 50/50", () => {
  const owed = owedByMember(200, "percent", [
    { memberId: "a", weight: 50 },
    { memberId: "b", weight: 50 },
  ]);
  assert.equal(owed.get("a"), 100);
  assert.equal(owed.get("b"), 100);
});

test("shares 2:1:1", () => {
  const owed = owedByMember(100, "shares", [
    { memberId: "a", weight: 2 },
    { memberId: "b", weight: 1 },
    { memberId: "c", weight: 1 },
  ]);
  assert.equal(owed.get("a"), 50);
  assert.equal(owed.get("b"), 25);
  assert.equal(owed.get("c"), 25);
});
