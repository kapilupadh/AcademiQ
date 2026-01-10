// src/components/Layout.jsx
//Standard layout hoi pages r krne , don't try to change anything

export default function Layout({ header, sidebar, children }) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-50 font-geist antialiased">
      {/* Only render the header if the 'header' prop exists */}
      {header && (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-[1400px] px-8">{header}</div>
        </header>
      )}

      <div className="mx-auto max-w-[1400px] px-8 py-10">
        {/* Switch grid based on if sidebar exists */}
        <div
          className={
            sidebar
              ? "grid grid-cols-[240px_1fr] gap-10"
              : "flex justify-center"
          }
        >
          {sidebar && (
            <aside className="hidden md:block w-[240px]">{sidebar}</aside>
          )}

          <main className={sidebar ? "w-full" : "w-full max-w-2xl"}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
// geist 'Font name'
