export function normName(s: string): string {
  return s
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function findMemberId(
  members: { id: string; name: string }[],
  name: string,
): string | undefined {
  const n = normName(name);
  const exact = members.find((m) => normName(m.name) === n);
  return exact?.id;
}
