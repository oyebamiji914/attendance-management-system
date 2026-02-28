import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
      <main className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          Biometric Attendance System
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Secure, real-time attendance tracking for students and lecturers.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
