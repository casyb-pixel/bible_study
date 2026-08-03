import { NewUserForm } from "@/components/NewUserForm";

export default function NewUserPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        New user
      </h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-700">
        Create a user record for study progress. Authentication is not used yet;
        keep the returned user ID to resume later.
      </p>
      <NewUserForm />
    </main>
  );
}
