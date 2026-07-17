import { useState } from 'react';
import { Lock, Globe, Eye, EyeOff, Radio } from 'lucide-react';
import { timeAgo } from '../utils/format';

export default function ChannelCard({ channel, onClick, showOwnerDetails = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPrivate = channel.channel_type === 'private';

  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-xl border border-hair bg-panel hover:bg-panel-hi hover:border-signal/40 transition-all p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-9 h-9 rounded-full bg-ink-soft border border-hair flex items-center justify-center text-signal">
            <Radio size={16} />
          </span>
          <span className="font-display font-semibold text-paper truncate">
            {channel.channel_name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-mist">
        <div className="flex items-center gap-3">
          {showOwnerDetails && (
            <span className="flex items-center gap-1">
              {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
              {isPrivate ? 'Private' : 'Public'}
            </span>
          )}
          {showOwnerDetails && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword((s) => !s);
              }}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex items-center gap-1 hover:text-signal transition-colors"
            >
              {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              {showPassword ? channel.channel_password : '••••••'}
            </span>
          )}
        </div>
        <span>{timeAgo(channel.created_at)}</span>
      </div>
    </button>
  );
}
