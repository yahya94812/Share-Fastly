import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, UploadCloud, ArrowLeft, Lock, Inbox, TriangleAlert } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';
import FileCard from '../components/FileCard';
import AccessChannelModal from '../components/modals/AccessChannelModal';
import UploadFileModal from '../components/modals/UploadFileModal';
import { getChannelToken, getLikedFiles, markFileLiked } from '../utils/storage';

export default function Channel() {
  const { channelName } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [channelToken, setChannelToken] = useState(() => getChannelToken(channelName));
  const [needsAccess, setNeedsAccess] = useState(false);
  const [query, setQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadAccessModal, setShowUploadAccessModal] = useState(false);
  const [likedFiles, setLikedFiles] = useState(() => getLikedFiles());
  const [pendingDownload, setPendingDownload] = useState(null);
  const [pendingLike, setPendingLike] = useState(null);

  const loadFiles = useCallback(
    async (tokenOverride) => {
      const token = tokenOverride !== undefined ? tokenOverride : channelToken;
      setLoading(true);
      setNotFound(false);
      try {
        const data = await api.listFiles(channelName, token);
        setFiles(data);
        setNeedsAccess(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setNeedsAccess(true);
        } else if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          toast.error(err instanceof ApiError ? err.message : 'Could not load this channel.');
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelName]
  );

  useEffect(() => {
    setChannelToken(getChannelToken(channelName));
    loadFiles(getChannelToken(channelName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter((f) => f.file_name.toLowerCase().includes(q));
  }, [files, query]);

  const handleDownload = async (file) => {
    setPendingDownload(file.file_id);
    try {
      const { download_url } = await api.getDownloadUrl(file.file_id, channelToken);
      const a = document.createElement('a');
      a.href = download_url;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setFiles((prev) =>
        prev.map((f) => (f.file_id === file.file_id ? { ...f, number_of_downloads: f.number_of_downloads + 1 } : f))
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not download this file.');
    } finally {
      setPendingDownload(null);
    }
  };

  const handleLike = async (file) => {
    setPendingLike(file.file_id);
    try {
      const { like_count } = await api.likeFile(file.file_id);
      setFiles((prev) => prev.map((f) => (f.file_id === file.file_id ? { ...f, number_of_likes: like_count } : f)));
      markFileLiked(file.file_id);
      setLikedFiles(getLikedFiles());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not like this file.');
    } finally {
      setPendingLike(null);
    }
  };

  const handleDelete = async (file) => {
    try {
      await api.deleteFile(file.file_id, channelToken);
      setFiles((prev) => prev.filter((f) => f.file_id !== file.file_id));
      toast.success(`${file.file_name} deleted.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete this file.');
    }
  };

  const handleUploadClick = () => {
    if (channelToken) {
      setShowUploadModal(true);
    } else {
      setShowUploadAccessModal(true);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-24 flex flex-col items-center text-center">
        <TriangleAlert size={28} className="text-mist mb-3 opacity-60" />
        <p className="font-display text-lg text-paper">Channel not found</p>
        <p className="text-sm text-mist mt-1 mb-5">“{channelName}” doesn't exist, or it was removed.</p>
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-1.5 rounded-lg border border-hair px-4 py-2.5 text-sm font-medium text-paper hover:border-signal/50 hover:text-signal transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Explore
        </button>
      </div>
    );
  }

  if (needsAccess) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-24 flex flex-col items-center text-center">
        <Lock size={28} className="text-mist mb-3 opacity-60" />
        <p className="font-display text-lg text-paper">This channel is private</p>
        <p className="text-sm text-mist mt-1">Enter the password to tune in.</p>
        <AccessChannelModal
          channelName={channelName}
          title="Access private channel"
          onClose={() => navigate('/explore')}
          onSuccess={(name, token) => {
            setChannelToken(token);
            loadFiles(token);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-mist hover:text-paper transition-colors mb-5"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="font-display text-2xl font-semibold text-paper truncate">{channelName}</h1>
        {channelToken && (
          <span className="text-xs font-mono text-teal border border-teal/30 rounded-full px-2.5 py-0.5">
            unlocked
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            aria-label="Search files"
            className="w-full rounded-lg bg-panel border border-hair pl-10 pr-3.5 py-2.5 text-sm text-paper placeholder:text-mist/60 focus:border-signal outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleUploadClick}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-signal text-ink font-medium px-4 py-2.5 text-sm hover:bg-signal-soft transition-colors whitespace-nowrap"
        >
          <UploadCloud size={15} />
          Upload new file
        </button>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : sortedFiles.length === 0 ? (
        <EmptyState hasQuery={!!query.trim()} onUpload={handleUploadClick} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFiles.map((file) => (
            <FileCard
              key={file.file_id}
              file={file}
              liked={likedFiles.has(file.file_id)}
              downloading={pendingDownload === file.file_id}
              liking={pendingLike === file.file_id}
              canDelete={!!channelToken}
              onDownload={() => handleDownload(file)}
              onLike={() => handleLike(file)}
              onDelete={() => handleDelete(file)}
            />
          ))}
        </div>
      )}

      {showUploadAccessModal && (
        <AccessChannelModal
          channelName={channelName}
          title="Enter the channel password to upload"
          onClose={() => setShowUploadAccessModal(false)}
          onSuccess={(name, token) => {
            setChannelToken(token);
            setShowUploadAccessModal(false);
            setShowUploadModal(true);
          }}
        />
      )}

      {showUploadModal && (
        <UploadFileModal
          channelName={channelName}
          channelToken={channelToken}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            setShowUploadModal(false);
            toast.success('File uploaded.');
            loadFiles();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ hasQuery, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 text-mist">
      <Inbox size={28} className="mb-3 opacity-60" />
      <p className="font-display text-lg text-paper">No files found</p>
      <p className="text-sm mt-1 max-w-xs mb-5">
        {hasQuery ? 'Try a different search term.' : 'Nothing has been shared here yet.'}
      </p>
      {!hasQuery && (
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 rounded-lg bg-signal text-ink font-medium px-4 py-2.5 text-sm hover:bg-signal-soft transition-colors"
        >
          <UploadCloud size={15} />
          Upload new file
        </button>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-hair bg-panel h-[168px] animate-pulse" />
      ))}
    </div>
  );
}
