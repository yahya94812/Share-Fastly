import { useState } from 'react';
import Modal from '../Modal';
import { api, ApiError } from '../../api/client';
import { saveChannelToken } from '../../utils/storage';

/**
 * Prompts for a channel password and resolves a channel token.
 * If `channelName` is provided, that field is pre-filled and disabled.
 */
export default function AccessChannelModal({ channelName = '', onClose, onSuccess, title }) {
  const [name, setName] = useState(channelName);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.accessChannel(name.trim(), password);
      saveChannelToken(name.trim(), data.channel_token);
      onSuccess(name.trim(), data.channel_token);
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
    <Modal title={title || 'Access private channel'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-mist">Channel name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!channelName}
            required
            autoFocus={!channelName}
            className="rounded-lg bg-ink-soft border border-hair px-3.5 py-2.5 text-paper disabled:opacity-60 focus:border-signal outline-none transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-mist">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus={!!channelName}
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
          {submitting ? 'Verifying…' : 'Unlock channel'}
        </button>
      </form>
    </Modal>
  );
}
