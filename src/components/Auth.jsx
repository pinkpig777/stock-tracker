import { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      toast.success('Check your email for the login link!');
    } catch (error) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Asset Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Enter your email to sign in to your dashboard</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white px-6 py-10 shadow-xl ring-1 ring-slate-900/5 sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">Email address</label>
                    <div className="mt-2">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-3"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? 'Sending link...' : 'Sign in with Magic Link'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
