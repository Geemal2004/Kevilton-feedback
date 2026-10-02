import FeedbackForm from "@/components/FeedbackForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          Kevilton App Feedback
        </h1>
        <p className="mt-2 text-base opacity-80">
          Tell us what worked, what was hard, and what we should improve.
        </p>
      </header>
      <FeedbackForm />
      <footer className="mt-10 text-center text-xs opacity-60">
        Feedback from testers of the Kevilton Smart Switch app.
      </footer>
    </main>
  );
}
