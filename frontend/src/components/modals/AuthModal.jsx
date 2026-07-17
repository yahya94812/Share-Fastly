import { useState } from 'react';
import Modal from '../Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const { login, signup } = useAuth();
  const toast = useToast();

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');

    if (isSignup && password !== confirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email, password);
        toast.success('Account created. Welcome to Share Fastly.');
      } else {
        await login(email, password);
        toast.success('Signed in.');
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldError(err.message);
      } else {
        setFieldError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isSignup ? 'Create your account' : 'Sign in'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
        {isSignup && (
          <Field
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            minLength={6}
          />
        )}

        {fieldError && (
          <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {fieldError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-signal text-ink font-medium py-2.5 hover:bg-signal-soft transition-colors disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </button>

        <p className="text-sm text-mist text-center">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup');
              setFieldError('');
            }}
            className="text-signal hover:text-signal-soft font-medium"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </Modal>
  );
}

function Field({ label, type, value, onChange, autoFocus, required, minLength }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-mist">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        required={required}
        minLength={minLength}
        className="rounded-lg bg-ink-soft border border-hair px-3.5 py-2.5 text-paper placeholder:text-mist/50 focus:border-signal outline-none transition-colors"
      />
    </label>
  );
}
