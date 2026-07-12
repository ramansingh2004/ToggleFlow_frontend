export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#07090f] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium text-indigo-300">
          ToggleFlow
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-3 text-zinc-500">
          Your authenticated workspace is ready.
        </p>
      </div>
    </main>
  );
}