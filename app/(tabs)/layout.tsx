import { readStatus } from "@/lib/status";
import { StatusProvider } from "./status";
import { TabBar } from "./tab-bar";
import { RefreshOnReturn } from "./refresh-on-return";

// The app shell: every screen behind the PIN sits in here, above the tab bar.
// The login screen is outside this folder, so it has no tab bar.
//
// The red dots are read once, here. Moving between tabs doesn't redraw this
// layout, so the dots are brought up to date by the things that can change
// them — saving or deleting an entry, exporting a backup — and whenever the app
// comes back to the front (RefreshOnReturn).
export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const status = await readStatus();

  return (
    <StatusProvider status={status}>
      {/* Room at the bottom for the tab bar, so nothing is ever hidden behind it. */}
      <div className="flex flex-1 flex-col pb-[calc(2.375rem+max(1.75rem,env(safe-area-inset-bottom)))]">
        {children}
      </div>
      <TabBar />
      <RefreshOnReturn />
    </StatusProvider>
  );
}
