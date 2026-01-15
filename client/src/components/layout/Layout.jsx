// src/components/Layout.jsx
//Standard layout hoi pages r krne , don't try to change anything

export default function Layout({ header, children }) {
  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-geist antialiased transition-colors duration-300">
      {/* Only render the header if the 'header' prop exists */}
      {header && (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
          <div className="mx-auto max-w-[1400px] px-8">{header}</div>
        </header>
      )}

      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
// geist 'Font name'
