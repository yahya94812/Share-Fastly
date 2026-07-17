import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lock, LogOut, RadioTower } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';
import ChannelCard from '../components/ChannelCard';
import AccessChannelModal from '../components/modals/AccessChannelModal';
import { clearAllChannelTokens } from '../utils/storage';

export default function Explore() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listPublicChannels()
      .then((data) => {
        if (!cancelled) setChannels(data);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : 'Could not load channels.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...channels].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter((c) => c.channel_name.toLowerCase().includes(q));
  }, [channels, query]);

  const handleChannelClick = (channel) => {
    navigate(`/channel/${encodeURIComponent(channel.channel_name)}`);
  };

  const handleLogoutChannels = () => {
    clearAllChannelTokens();
    toast.success('Logged out of all channels on this device.');
  };

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels…"
              aria-label="Search channels"
              className="w-full rounded-lg bg-panel border border-hair pl-10 pr-3.5 py-2.5 text-sm text-paper placeholder:text-mist/60 focus:border-signal outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setShowAccessModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-hair px-4 py-2.5 text-sm font-medium text-paper hover:border-signal/50 hover:text-signal transition-colors whitespace-nowrap"
          >
            <Lock size={14} />
            Access private
          </button>
        </div>

        <button
          onClick={handleLogoutChannels}
          className="flex items-center gap-1.5 text-sm text-mist hover:text-danger transition-colors self-end sm:self-auto"
        >
          <LogOut size={14} />
          Log out of channels
        </button>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query.trim()} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((channel) => (
            <ChannelCard key={channel.channel_name} channel={channel} onClick={() => handleChannelClick(channel)} />
          ))}
        </div>
      )}

      {showAccessModal && (
        <AccessChannelModal
          onClose={() => setShowAccessModal(false)}
          onSuccess={(name) => {
            setShowAccessModal(false);
            navigate(`/channel/${encodeURIComponent(name)}`);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ hasQuery }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 text-mist">
      <RadioTower size={28} className="mb-3 opacity-60" />
      <p className="font-display text-lg text-paper">No channels found</p>
      <p className="text-sm mt-1 max-w-xs">
        {hasQuery ? 'Try a different search term.' : 'Nothing is broadcasting publicly yet — check back soon.'}
      </p>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-hair bg-panel h-[92px] animate-pulse" />
      ))}
    </div>
  );
}
