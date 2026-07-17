import { useState } from 'react';
import { Download, Heart, FileText, Image as ImageIcon, FileArchive, FileAudio, FileVideo, Trash2 } from 'lucide-react';
import { timeAgo, formatFileSize } from '../utils/format';

function iconForMime(mime = '') {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('audio/')) return FileAudio;
  if (mime.startsWith('video/')) return FileVideo;
  if (mime.includes('zip') || mime.includes('compressed')) return FileArchive;
  return FileText;
}

export default function FileCard({ file, liked, onDownload, onLike, onDelete, canDelete, downloading, liking }) {
  const [likedLocal, setLikedLocal] = useState(liked);
  const Icon = iconForMime(file.mime_type);

  const handleLike = () => {
    if (likedLocal || liking) return;
    setLikedLocal(true);
    onLike();
  };

  return (
    <div className="group rounded-xl border border-hair bg-panel hover:border-signal/30 transition-colors p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 w-9 h-9 rounded-lg bg-ink-soft border border-hair flex items-center justify-center text-teal">
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-paper truncate" title={file.file_name}>
            {file.file_name}
          </p>
          <p className="text-xs font-mono text-mist mt-0.5">
            {formatFileSize(file.file_size)} · {file.mime_type || 'unknown'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-mist">
        <span>{timeAgo(file.created_at)}</span>
        <span>{file.number_of_downloads} downloads</span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-hair -mx-5 px-5 mt-1">
        <div className="flex items-center gap-2 flex-1 pt-3">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-signal text-ink text-sm font-medium py-2 hover:bg-signal-soft transition-colors disabled:opacity-60"
          >
            <Download size={14} />
            {downloading ? 'Preparing…' : 'Download'}
          </button>
          <button
            onClick={handleLike}
            disabled={likedLocal || liking}
            aria-pressed={likedLocal}
            aria-label={likedLocal ? 'Liked' : 'Like this file'}
            className={`flex items-center gap-1.5 rounded-lg border text-sm font-medium py-2 px-3 transition-colors ${
              likedLocal
                ? 'border-danger/40 text-danger bg-danger/10'
                : 'border-hair text-mist hover:text-danger hover:border-danger/40'
            }`}
          >
            <Heart size={14} fill={likedLocal ? 'currentColor' : 'none'} />
            {file.number_of_likes}
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              aria-label="Delete file"
              className="flex items-center justify-center rounded-lg border border-hair text-mist hover:text-danger hover:border-danger/40 transition-colors py-2 px-3"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
