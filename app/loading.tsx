import { Bone, Rows } from "./skeleton";

// The home screen while it loads, and the fallback for any screen without a
// skeleton of its own (the backup screen).
export default function Loading() {
  return (
    <main aria-busy="true" className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <Bone className="h-8 w-40" />
      <Rows rows={8} />
    </main>
  );
}
