import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "framer-motion";
import { Camera, Globe2, Sparkles } from "lucide-react";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue as guest");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo and Hero */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <Camera className="w-10 h-10 md:w-12 md:h-12 text-white -rotate-12" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2"
          >
            <Globe2 className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
          </motion.div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-3">
          WORLDSTAMP
        </h1>
        <p className="text-white/50 text-sm md:text-base font-light tracking-wide max-w-xs mx-auto">
          Capture your moment. Share with the world.
          <br />
          <span className="text-violet-400">Every 12 hours.</span>
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="relative">
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-3xl blur-xl" />

          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <input name="flow" type="hidden" value={flow} />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {flow === "signIn" ? "Sign In" : "Create Account"}
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                className="text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0a0a0f]/50 text-white/30 uppercase tracking-wider">or</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnonymous}
              disabled={isLoading}
              className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue as Guest
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Feature hints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 md:mt-12 flex flex-wrap justify-center gap-4 md:gap-8 text-xs text-white/30"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
          <span>Real-time updates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
          <span>Global community</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
          <span>12-hour windows</span>
        </div>
      </motion.div>
    </div>
  );
}
