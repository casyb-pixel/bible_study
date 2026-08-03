export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Bible Study
      </h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-700">
        A hands-free study application for reading the Legacy Standard Bible
        and the writings the Bible itself references. Progress is tracked so
        study can pause and resume at a precise place.
      </p>
      <p className="mt-4 text-base leading-relaxed text-neutral-700">
        This is a private family study tool. Scripture alone is authoritative.
        Non-canonical writings, when present, are labeled as historical only.
      </p>
    </main>
  );
}
