import PersonaForm from "@/components/capture/PersonaForm";

export default function NewPersonaPage() {
  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Create a persona
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700 dark:text-zinc-300">
            Start with the essentials. The richer capture work begins after this
            first profile exists.
          </p>
        </div>

        <PersonaForm />
      </section>
    </main>
  );
}
