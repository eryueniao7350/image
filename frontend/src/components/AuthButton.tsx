import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { buildCurrentPath, buildLoginPath } from "../utils/routeIntents";

export function AuthButton() {
  const { user, loading, signInWithMagicLink, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // If Supabase is not configured, don't render
  if (!supabase) return null;
  if (loading) return null;

  const resetForm = () => {
    setError("");
    setMessage("");
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await signInWithMagicLink(email, buildCurrentPath(location));
      resetForm();
      setMessage("Check your inbox for a magic link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="User avatar"
              className="w-7 h-7 rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              {(user.email?.[0] || "U").toUpperCase()}
            </div>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
            <div className="px-4 py-2 text-xs text-gray-500 truncate border-b border-gray-100">
              {user.email}
            </div>
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium cursor-pointer"
      >
        Sign in
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-5 z-50">
          <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">
            Continue with a magic link
          </h3>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            {message && (
              <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-xs text-green-700">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitting ? "Sending..." : "Email me a sign-in link"}
            </button>
          </form>

          <div className="mt-3 text-center text-xs text-gray-500">
            <Link
              className="text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => setOpen(false)}
              to={buildLoginPath(buildCurrentPath(location))}
            >
              Open full sign-in page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
