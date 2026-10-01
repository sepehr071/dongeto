const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(input: string): string {
  return [...input]
    .map((ch) => {
      const p = PERSIAN_DIGITS.indexOf(ch);
      if (p >= 0) return String(p);
      const a = ARABIC_DIGITS.indexOf(ch);
      if (a >= 0) return String(a);
      return ch;
    })
    .join("");
}

export function formatToman(amount: number): string {
  const n = Math.round(amount);
  const grouped = Math.abs(n).toLocaleString("fa-IR");
  return n < 0 ? `−${grouped}` : grouped;
}

const UNIT_MULT: { needle: string; mul: number }[] = [
  { needle: "میلیارد", mul: 1_000_000_000 },
  { needle: "میلیون", mul: 1_000_000 },
  { needle: "هزار", mul: 1_000 },
];

/** Parse Persian/English toman phrases. Returns integer tomans or null. */
export function parseToman(raw: string): number | null {
  let s = toEnglishDigits(raw).trim();
  if (!s) return null;
  s = s.replace(/[٬,]/g, "");
  s = s.replace(/تومان|تومن| irr|rial|ریال/gi, " ");

  let mul = 1;
  for (const u of UNIT_MULT) {
    if (s.includes(u.needle)) {
      mul *= u.mul;
      s = s.split(u.needle).join(" ");
    }
  }

  s = s.replace(/[^\d.]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return null;

  const parts = s.split(" ").filter(Boolean);
  if (parts.length === 1) {
    const n = Number(parts[0]);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * mul);
  }

  // "4 5" after stripping is junk; "4.5" already one part
  const n = Number(parts.join(""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * mul);
}
