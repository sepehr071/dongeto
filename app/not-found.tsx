import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-stamp">گروه پیدا نشد</p>
      <p className="mt-2 text-ink/70">لینک اشتباهه یا پاک شده.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center bg-stamp px-4 text-paper"
      >
        برگرد به دنگتو
      </Link>
    </main>
  );
}
