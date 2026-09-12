// Smoking's own colour for its buttons and highlights, on every screen in this
// folder (see [data-tab] in globals.css). Nutrition's screens need nothing: its
// green is the default.
export default function SmokingLayout({ children }: LayoutProps<"/smoking">) {
  return (
    <div data-tab="smoking" className="contents">
      {children}
    </div>
  );
}
