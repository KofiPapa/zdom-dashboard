import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";
import {
  HiOutlineDesktopComputer,
  HiOutlineTemplate,
  HiOutlineChartBar,
  HiOutlineGlobe,
} from "react-icons/hi";

const FEATURES = [
  {
    icon: HiOutlineDesktopComputer,
    title: "Manage Any Screen",
    desc: "Control TVs, monitors & kiosks from one dashboard",
  },
  {
    icon: HiOutlineTemplate,
    title: "Drag & Drop Editor",
    desc: "Build stunning layouts with our visual template builder",
  },
  {
    icon: HiOutlineChartBar,
    title: "Real-Time Analytics",
    desc: "Track plays, uptime, and audience engagement",
  },
  {
    icon: HiOutlineGlobe,
    title: "Remote Management",
    desc: "Update content on screens anywhere in the world",
  },
];

export default function LoginPage() {
  const { user, signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Marketing Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-lg font-bold">Z</span>
            </div>
            <span className="text-xl font-bold">ZDOM</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Your screens,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
              your story.
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-md">
            The all-in-one digital signage platform trusted by businesses to power engaging screen experiences.
          </p>

          {/* Feature list */}
          <div className="space-y-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-14 pt-8 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-slate-500 text-xs">Screens Powered</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-slate-500 text-xs">Uptime SLA</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-slate-500 text-xs">Countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ZDOM</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to manage your screens</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            New to ZDOM?{" "}
            <Link to="/register" className="text-primary hover:text-primary-dark font-semibold">
              Create a free account
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in, you agree to our{" "}
            <a href="https://zdom.vercel.app/terms" className="underline hover:text-slate-600">Terms</a>{" "}
            and{" "}
            <a href="https://zdom.vercel.app/privacy" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
