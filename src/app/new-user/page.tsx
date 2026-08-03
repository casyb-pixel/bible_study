import Link from "next/link";

import { NewUserForm } from "@/components/NewUserForm";

export default function NewUserPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-14 sm:px-8 sm:py-16">
      <header className="border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          New user
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-700">
          Choose a simple username for study progress. Authentication is not
          used yet; remember the username to resume later.
        </p>
      </header>
      <NewUserForm />
      <p className="mt-10 text-sm text-neutral-600">
        <Link
          href="/"
          className="underline underline-offset-4 hover:text-neutral-900"
        >
          Return home
        </Link>
      </p>
    </main>
  );
}
