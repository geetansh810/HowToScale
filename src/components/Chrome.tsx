import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { SearchPalette } from './SearchPalette';
import { Search } from 'lucide-react';

const nav = [
  { to: '/journey', label: 'Journey' },
  { to: '/knowledge', label: 'Knowledge Base' },
  { to: '/graph', label: 'Map' },
  { to: '/walkthrough', label: 'Walkthrough' },
  { to: '/journal', label: 'Journal' },
];

export function Chrome() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-serif font-semibold text-lg tracking-tight">Emergent Architecture</span>
            <span className="meta hidden sm:inline">a system-design knowledge base</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 ml-4">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `text-[13px] font-medium transition-colors ${
                    isActive ? 'text-signal' : 'text-ink-2 hover:text-ink'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex items-center gap-2 text-[12px] font-mono text-ink-3 border border-line rounded-sm px-2.5 py-1.5 hover:border-ink-3 transition-colors"
          >
            <Search size={13} />
            <span className="hidden sm:inline">search symptoms, concepts, tech…</span>
            <kbd className="hidden lg:inline text-[10px] border border-line rounded px-1">⌘K</kbd>
          </button>
        </div>
        <nav className="md:hidden border-t border-line overflow-x-auto">
          <div className="flex px-4 gap-5 py-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `text-[12px] whitespace-nowrap font-medium ${isActive ? 'text-signal' : 'text-ink-2'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-ink text-paper mt-24">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 grid md:grid-cols-3 gap-10">
          <div>
            <div className="font-serif text-xl font-semibold">Emergent Architecture</div>
            <p className="mt-3 text-[13px] leading-relaxed text-paper/60 max-w-xs">
              Don&rsquo;t memorize architectures. Learn how architectures emerge — one condition, one problem, one
              decision at a time.
            </p>
          </div>
          <div>
            <div className="meta text-paper/40 mb-4">Explore</div>
            <ul className="space-y-2 text-[13px]">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-paper/75 hover:text-paper transition-colors">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="meta text-paper/40 mb-4">Method</div>
            <p className="font-mono text-[12px] leading-loose text-paper/60">
              conditions → problem → options → decision
              <br />→ architecture → trade-offs → failure
              <br />→ new problem
            </p>
          </div>
        </div>
        <div className="border-t border-paper/10">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-4 flex justify-between meta text-paper/35">
            <span>public beta · part 1</span>
            <span>built in public</span>
          </div>
        </div>
      </footer>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
