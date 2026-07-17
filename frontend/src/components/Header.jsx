import { Link, useLocation } from 'react-router-dom';
import { Radio } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isExplore = location.pathname === '/' || location.pathname.startsWith('/explore');

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="signal-dot text-signal">
            <Radio size={20} strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Share<span className="text-signal">Fastly</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-hair bg-panel p-1">
          <Link
            to="/explore"
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              isExplore ? 'bg-signal text-ink' : 'text-mist hover:text-paper'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/dashboard"
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              isDashboard ? 'bg-signal text-ink' : 'text-mist hover:text-paper'
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="w-[92px]" aria-hidden="true" />
      </div>
    </header>
  );
}
