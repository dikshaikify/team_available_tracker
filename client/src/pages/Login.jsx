import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      if (remember) localStorage.setItem("remember", "1");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  // DEMO GOOGLE LOGIN — bypasses backend entirely.
  // Stores a fake Google user in localStorage and redirects.
  function handleGoogleLogin() {
    setError("");
    setBusy(true);

    const demoUser = {
      id: "google-demo",
      email: "google.demo@team.io",
      name: "Google Demo User",
      provider: "google",
    };

    localStorage.setItem("token", "demo-google-token");
    localStorage.setItem("user", JSON.stringify(demoUser));

    // Small delay so the "busy" state is visible
    setTimeout(() => {
      navigate("/dashboard");
    }, 300);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">
          Log in to your account
        </h1>

        {/* Login with Google (demo) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-2.5 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 16.3 3 9.7 7.4 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.9 26.8 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 40.5 16.2 45 24 45z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.3 5.3C41.4 35.4 44 30.2 44 24c0-1.4-.2-2.4-.4-3.5z"
            />
          </svg>
          <span className="text-sm font-medium text-slate-700">
            Login with Google
          </span>
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email + password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-300"
            />
            Remember Me
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {busy ? "Signing in..." : "Log In"}
          </button>

          <div className="text-center text-sm">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-blue-600 hover:underline"
            >
              Forgot Your Password?
            </a>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-blue-600 hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}