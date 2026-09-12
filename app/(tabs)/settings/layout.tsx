// Settings's own colour for its buttons and highlights, on every screen in this
// folder (see [data-tab] in globals.css). Nutrition's screens need nothing: its
// green is the default.
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div data-tab="settings" className="contents">
      {children}
    </div>
  );
}
