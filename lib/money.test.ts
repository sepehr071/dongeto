import assert from "node:assert/strict";
import { test } from "node:test";
import { formatToman, parseToman } from "./money";

test("parse ۴۵۰ هزار", () => {
  assert.equal(parseToman("۴۵۰ هزار"), 450_000);
});

test("parse 4.5 میلیون", () => {
  assert.equal(parseToman("4.5 میلیون"), 4_500_000);
});

test("parse grouped Persian", () => {
  assert.equal(parseToman("۴۵۰٬۰۰۰ تومان"), 450_000);
});

test("parse plain english", () => {
  assert.equal(parseToman("12000"), 12_000);
});

test("format fa-IR", () => {
  const s = formatToman(450000);
  assert.match(s, /۴۵۰/);
  assert.match(s, /۰۰۰/);
});
