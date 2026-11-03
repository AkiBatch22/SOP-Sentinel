type LoginPageProps = {
  searchParams: Promise<{ error?: string; reason?: string; returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//") && !params.returnTo.includes("\\")
    ? params.returnTo
    : "/guardrail.html";

  return (
    <main className="min-h-screen bg-[#f2f6f3] px-5 py-12 text-[#12211b]">
      <section className="mx-auto mt-[8vh] w-full max-w-md rounded-3xl border border-[#dfe6e2] bg-white p-8 shadow-[0_20px_60px_rgba(21,48,37,0.08)]">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#12211b] font-bold text-[#c9f3d9]">S</span>
          <div>
            <p className="m-0 text-sm font-bold">SOP Sentinel</p>
            <p className="m-0 mt-1 text-xs text-[#68746f]">Private founder pilot</p>
          </div>
        </div>

        <h1 className="m-0 text-3xl font-bold tracking-[-0.04em]">Enter the pilot</h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-[#68746f]">
          Use the password shared with you to access the protected prototype.
        </p>

        {params.error === "invalid" && (
          <p role="alert" className="mb-5 rounded-xl border border-[#f1c8c2] bg-[#fff0ed] px-4 py-3 text-sm text-[#8b2f29]">
            That password was not accepted. Please try again.
          </p>
        )}
        {params.reason === "configuration" && (
          <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This deployment is not configured yet. The owner needs to add the Vercel environment variables.
          </p>
        )}

        <form action="/api/auth/login" method="post" className="grid gap-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="grid gap-2 text-sm font-semibold">
            Pilot password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="rounded-xl border border-[#cbd6d0] px-4 py-3 text-base outline-none focus:border-[#286b50] focus:ring-4 focus:ring-[#286b50]/10"
            />
          </label>
          <button type="submit" className="mt-2 rounded-xl bg-[#174b38] px-4 py-3 font-bold text-white hover:bg-[#103e2d]">
            Open SOP Sentinel
          </button>
        </form>

        <p className="mb-0 mt-7 text-xs leading-5 text-[#7d8984]">
          Prototype access only. Do not submit confidential or personally identifiable information.
        </p>
      </section>
    </main>
  );
}
