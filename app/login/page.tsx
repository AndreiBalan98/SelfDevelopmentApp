import { PinForm } from "./pin-form";

export const metadata = { title: "Life Tracker" };

// The PIN screen, in the new look. It's the one screen outside the tab bar, so
// it has no header and no accent of its own — the default green.
export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-7 px-6">
      <h1 className="text-lg font-semibold">Life Tracker</h1>
      <PinForm />
    </main>
  );
}
