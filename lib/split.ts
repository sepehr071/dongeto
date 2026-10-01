import type { Share, SplitType } from "./types";

export class SplitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SplitError";
  }
}

/** Hamilton largest-remainder: integer parts sum exactly to `total`. */
export function distribute(total: number, weights: number[]): number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new SplitError("مبلغ باید عدد صحیح نامنفی باشد");
  }
  if (weights.length === 0) {
    throw new SplitError("حداقل یک نفر باید سهم داشته باشد");
  }
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new SplitError("وزن سهم نامعتبر است");
  }
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW <= 0) {
    throw new SplitError("جمع وزن‌ها باید بیشتر از صفر باشد");
  }

  const raw = weights.map((w) => (total * w) / sumW);
  const floors = raw.map((x) => Math.floor(x + 1e-12));
  let rem = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = [...floors];
  let k = 0;
  while (rem > 0) {
    out[order[k % order.length].i] += 1;
    rem -= 1;
    k += 1;
  }
  return out;
}

export function owedByMember(
  amount: number,
  splitType: SplitType,
  shares: Share[],
): Map<string, number> {
  if (shares.length === 0) {
    throw new SplitError("حداقل یک نفر باید در خرج شریک باشد");
  }
  const ids = shares.map((s) => s.memberId);
  if (new Set(ids).size !== ids.length) {
    throw new SplitError("اسم تکراری در سهم‌ها");
  }

  let parts: number[];
  if (splitType === "equal") {
    parts = distribute(
      amount,
      shares.map(() => 1),
    );
  } else if (splitType === "exact") {
    const sum = shares.reduce((a, s) => a + s.weight, 0);
    if (Math.round(sum) !== amount) {
      throw new SplitError(
        `جمع مبالغ دقیق (${Math.round(sum)}) با کل خرج (${amount}) یکی نیست`,
      );
    }
    parts = shares.map((s) => Math.round(s.weight));
    const drift = amount - parts.reduce((a, b) => a + b, 0);
    if (drift !== 0) parts[0] += drift;
  } else if (splitType === "percent") {
    parts = distribute(
      amount,
      shares.map((s) => s.weight),
    );
  } else {
    parts = distribute(
      amount,
      shares.map((s) => s.weight),
    );
  }

  const map = new Map<string, number>();
  shares.forEach((s, i) => map.set(s.memberId, parts[i]));
  return map;
}
