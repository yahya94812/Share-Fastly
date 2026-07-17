import { useState } from 'react';
import Modal from '../Modal';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CreateChannelModal({ onClose, onCreated }) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('public');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createChannel(session.accessToken, {
        channel_name: name.trim(),
        channel_type: type,
        channel_password: password,
      });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create a new channel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-mist">Channel name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            pattern="[a-zA-Z0-9\-_]+"
            title="Letters, numbers, hyphens and underscores only"
            className="rounded-lg bg-ink-soft border border-hair px-3.5 py-2.5 text-paper focus:border-signal outline-none transition-colors"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-mist">Visibility</span>
          <div className="grid grid-cols-2 gap-2">
            {['public', 'private'].map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setType(option)}
                className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium capitalize transition-colors ${
                  type === option
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-hair text-mist hover:text-paper'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs text-mist mt-0.5">
            {type === 'public'
              ? 'Anyone can view files. The password is required to upload or delete.'
              : 'The password is required to view, upload, or delete files.'}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-mist">Channel password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
            className="rounded-lg bg-ink-soft border border-hair px-3.5 py-2.5 text-paper focus:border-signal outline-none transition-colors"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-signal text-ink font-medium py-2.5 hover:bg-signal-soft transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create channel'}
        </button>
      </form>
    </Modal>
  );
}
