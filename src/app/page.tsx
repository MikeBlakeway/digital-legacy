export default function Home() {
  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-10 px-6 py-24 sm:px-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
            Digital Legacy
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700 dark:text-zinc-300">
            A private, self-hosted foundation for capturing memories, voice,
            media, and family conversations through isolated AI personas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Next.js", "App Router, TypeScript, Tailwind CSS"],
            ["Supabase", "Auth, Postgres, pgvector, RLS"],
            ["Storage + AI", "B2 media storage and private RunPod inference"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-sm font-medium text-stone-500 dark:text-zinc-400">
                {label}
              </h2>
              <p className="mt-3 text-base leading-7">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
