import { PinForm } from "./pin-form";

export const metadata = { title: "Life Tracker" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-lg font-medium tracking-tight text-muted">Life Tracker</h1>
      <PinForm />
    </main>
  );
}
