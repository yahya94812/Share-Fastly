import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Compass, FolderPlus, Play } from 'lucide-react';
import { markVisited } from '../utils/storage';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    markVisited();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-16 w-full">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal border border-teal/30 rounded-full px-3 py-1">
              <span className="signal-dot w-1.5 h-1.5 rounded-full bg-teal inline-block" />
              broadcasting since today
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.08] mt-5 text-paper">
              Tune a channel.
              <br />
              Send the file.
              <br />
              <span className="text-signal">Done.</span>
            </h1>
            <p className="text-mist text-base mt-5 max-w-md leading-relaxed">
              Share Fastly turns file sharing into a frequency: spin up a channel, hand out
              the password, and anyone tuned in can pull what they need — no accounts required
              to receive.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-lg bg-signal text-ink font-medium px-5 py-3 hover:bg-signal-soft transition-colors"
              >
                <FolderPlus size={17} />
                Create a channel
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center gap-2 rounded-lg border border-hair text-paper font-medium px-5 py-3 hover:border-signal/50 hover:text-signal transition-colors"
              >
                <Compass size={17} />
                Explore public channels
              </button>
            </div>
          </div>

          <div className="animate-fade-up rounded-2xl border border-hair bg-panel overflow-hidden" style={{ animationDelay: '0.08s' }}>
            <div className="aspect-video w-full bg-ink-soft flex items-center justify-center relative group cursor-pointer">
              <div className="absolute inset-0 opacity-[0.15]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, var(--color-teal) 0px, transparent 1px, transparent 3px)',
              }} />
              <span className="signal-dot relative z-10 w-16 h-16 rounded-full bg-signal/15 border border-signal/40 flex items-center justify-center text-signal group-hover:bg-signal/25 transition-colors">
                <Play size={22} fill="currentColor" />
              </span>
            </div>
            <div className="p-5 flex items-center gap-3">
              <Radio size={16} className="text-signal shrink-0" />
              <p className="text-sm text-mist">
                A 90-second look at creating a channel and sharing your first file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
