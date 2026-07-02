'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Magic link sent! Check your email for the login link.',
      });
      setEmail('');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsGoogleLoading(false);
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070708] px-4 font-sans text-zinc-100">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-purple-900/10 blur-[120px] filter" />
        <div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[80%] rounded-full bg-emerald-950/10 blur-[120px] filter" />
      </div>

      {/* Embedded CSS for custom gradient animation */}
      <style jsx global>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradientMove 10s ease infinite;
        }
      `}</style>

      {/* Main Container Card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-8 shadow-2xl backdrop-blur-xl">
        {/* Branding & Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-950/20 text-xl font-bold text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            H
          </div>
          <h2 className="mt-4 bg-gradient-to-r from-zinc-100 via-purple-300 to-emerald-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Welcome back, Hamid
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to access your portfolio OS dashboard
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg p-4 text-sm transition-all duration-300 ${
              message.type === 'success'
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 py-3.5 px-4 font-semibold text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Separator Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/80" />
          </div>
          <span className="relative bg-[#0d0d0f] px-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            or
          </span>
        </div>

        {/* Email Magic Link Form */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative mt-2">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hamid@haaamid.art"
                disabled={isGoogleLoading || isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-3.5 pr-4 pl-12 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-offset-zinc-950 transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGoogleLoading || isLoading || !email}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 px-4 font-semibold text-white shadow-lg shadow-purple-900/20 transition-all duration-200 hover:shadow-purple-600/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Send Magic Link</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
