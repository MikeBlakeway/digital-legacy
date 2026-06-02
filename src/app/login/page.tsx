import LoginForm from "@/app/login/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    redirectedFrom?: string | string[];
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectedFrom = readSearchParam(params.redirectedFrom);
  const initialError = getInitialError(readSearchParam(params.error));

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700 dark:text-zinc-300">
            Access your private capture workspace.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <LoginForm redirectedFrom={redirectedFrom} initialError={initialError} />
        </div>
      </section>
    </main>
  );
}

function readSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getInitialError(error: string): string | null {
  if (error === "link_expired") {
    return "That sign-in link has expired. Sign in with your email and password.";
  }

  return null;
}
