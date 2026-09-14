import PasswordSetupForm from "@/app/account/setup/PasswordSetupForm";

export default function AccountSetupPage() {
  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mb-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">
            Private family workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Finish setting up your account
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700 dark:text-zinc-300">
            Choose a password for future visits. Use at least 12 characters and
            keep it somewhere safe.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <PasswordSetupForm />
        </div>
      </section>
    </main>
  );
}
