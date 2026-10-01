import { CreateForm } from "@/components/CreateForm";
import { RecentGroups } from "@/components/RecentGroups";

const SAMPLE = [
  { from: "سارا", amount: "۳۰۰٬۰۰۰" },
  { from: "رضا", amount: "۳۰۰٬۰۰۰" },
  { from: "مریم", amount: "۳۰۰٬۰۰۰" },
];

function SampleSlip() {
  return (
    <figure className="mx-auto w-full max-w-sm lg:mt-6" aria-label="نمونه">
      <p className="mb-3 max-w-xs bg-paper-2 px-3 py-2 text-sm leading-7 shadow-[2px_2px_0_var(--shadow)] ring-1 ring-ink/80">
        شام ۱ میلیون و ۲۰۰ هزار رو علی حساب کرد، بین علی، سارا، رضا و مریم
      </p>
      <div className="slip -rotate-1 overflow-hidden">
        <div className="slip-perforation" />
        <div className="flex items-start justify-between px-4 pt-3 pb-2">
          <div>
            <p className="text-xs text-ink/70">رسید تسویه · نمونه</p>
            <p className="mt-1 text-xl font-black">بریزین به علی</p>
          </div>
          <span className="stamp-mark mt-1 text-sm">دنگتو</span>
        </div>
        <ul className="border-t border-dashed border-ink/30">
          {SAMPLE.map((r) => (
            <li
              key={r.from}
              className="flex items-baseline justify-between px-4 py-2.5"
            >
              <span className="font-bold">{r.from}</span>
              <span className="tabular text-lg font-black text-stamp">
                {r.amount}
                <span className="mr-1 text-xs font-bold text-ink/70">ت</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-ink/20 px-4 py-2 text-xs text-ink/70">
          ۳ کارت به کارت
        </p>
      </div>
      <figcaption className="mt-4 text-center text-xs text-ink/60">
        مدل فقط خرج رو می‌فهمه؛ حساب و کتاب با کد قطعیه.
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:py-16 lg:grid-cols-[1fr_24rem] lg:gap-20">
      <div className="flex max-w-xl flex-col">
        <h1 className="text-6xl font-black leading-none tracking-tight sm:text-7xl">
          دنگتو
        </h1>
        <p className="mt-5 max-w-md text-xl leading-9 text-ink/80">
          بگو کی چی داده. خودمون می‌گیم کی به کی کارت به کارت کنه.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/70">
          <li>بدون ثبت‌نام</li>
          <li>فارسی بنویس، مثل پیام تلگرام</li>
          <li>کمترین تعداد انتقال</li>
        </ul>

        <section className="mt-10 border-t-2 border-ink pt-6">
          <CreateForm />
        </section>

        <RecentGroups />
      </div>

      <SampleSlip />
    </main>
  );
}
