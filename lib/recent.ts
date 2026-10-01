export type RecentGroup = { token: string; title: string; at: number };

const KEY = "dongeto:groups";
export const EMPTY_RECENT: RecentGroup[] = [];

let snapshot: RecentGroup[] = EMPTY_RECENT;
let snapshotRaw: string | null = null;

export function loadRecent(): RecentGroup[] {
  if (typeof window === "undefined") return EMPTY_RECENT;
  try {
    const raw = localStorage.getItem(KEY) ?? "";
    if (raw === snapshotRaw) return snapshot;
    snapshotRaw = raw;
    const list = raw ? (JSON.parse(raw) as RecentGroup[]) : [];
    snapshot = list.sort((a, b) => b.at - a.at).slice(0, 12);
    return snapshot;
  } catch {
    return snapshot;
  }
}

const listeners = new Set<() => void>();

export function subscribeRecent(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((cb) => cb());
}

export function rememberGroup(token: string, title: string) {
  const next = [
    { token, title, at: Date.now() },
    ...loadRecent().filter((g) => g.token !== token),
  ].slice(0, 12);
  snapshot = next;
  snapshotRaw = JSON.stringify(next);
  localStorage.setItem(KEY, snapshotRaw);
  emit();
}

export function getServerRecent(): RecentGroup[] {
  return EMPTY_RECENT;
}

export function speakerKey(token: string) {
  return `dongeto:me:${token}`;
}
