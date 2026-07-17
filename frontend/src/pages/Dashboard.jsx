import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, LayoutGrid } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChannelCard from '../components/ChannelCard';
import CreateChannelModal from '../components/modals/CreateChannelModal';
import AuthModal from '../components/modals/AuthModal';
import { saveChannelToken } from '../utils/storage';

export default function Dashboard() {
  const { session, isAuthenticated, logout } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accessingChannel, setAccessingChannel] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const loadChannels = useCallback(() => {
    if (!session) return;
    setLoading(true);
    api
      .listMyChannels(session.accessToken)
      .then(setChannels)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : 'Could not load your channels.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (isAuthenticated) loadChannels();
    else setLoading(false);
  }, [isAuthenticated, loadChannels]);

  const sorted = useMemo(
    () => [...channels].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [channels]
  );

  const handleLogoutAccount = () => {
    logout();
    navigate('/');
  };

  // Owner already knows the password, so unlock automatically and jump straight in.
  const handleChannelClick = async (channel) => {
    setAccessingChannel(channel.channel_name);
    try {
      const data = await api.accessChannel(channel.channel_name, channel.channel_password);
      saveChannelToken(channel.channel_name, data.channel_token);
      navigate(`/channel/${encodeURIComponent(channel.channel_name)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not open that channel.');
    } finally {
      setAccessingChannel(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-24 flex flex-col items-center text-center">
        <LayoutGrid size={28} className="text-mist mb-3 opacity-60" />
        <p className="font-display text-lg text-paper">Sign in to see your dashboard</p>
        <p className="text-sm text-mist mt-1">Your created channels live here.</p>
        <AuthModal onClose={() => navigate('/explore')} onSuccess={loadChannels} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-paper">Your channels</h1>
          <p className="text-sm text-mist mt-1">Signed in as {session.username}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoutAccount}
            className="flex items-center gap-1.5 text-sm text-mist hover:text-danger transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-signal text-ink font-medium px-4 py-2.5 text-sm hover:bg-signal-soft transition-colors"
          >
            <Plus size={15} />
            Create new channel
          </button>
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((channel) => (
            <div key={channel.channel_name} className="relative">
              <ChannelCard channel={channel} showOwnerDetails onClick={() => handleChannelClick(channel)} />
              {accessingChannel === channel.channel_name && (
                <div className="absolute inset-0 rounded-xl bg-ink/60 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-hair border-t-signal animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            toast.success('Channel created.');
            loadChannels();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 text-mist">
      <LayoutGrid size={28} className="mb-3 opacity-60" />
      <p className="font-display text-lg text-paper">No channels found</p>
      <p className="text-sm mt-1 max-w-xs mb-5">Create your first channel to start sharing files.</p>
      <button
        onClick={onCreate}
        className="flex items-center gap-1.5 rounded-lg bg-signal text-ink font-medium px-4 py-2.5 text-sm hover:bg-signal-soft transition-colors"
      >
        <Plus size={15} />
        Create new channel
      </button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-hair bg-panel h-[92px] animate-pulse" />
      ))}
    </div>
  );
}
