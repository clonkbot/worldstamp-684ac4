import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, LogOut, Clock, Users, Image } from "lucide-react";
import { GlobeView } from "./GlobeView";
import { CameraCapture } from "./CameraCapture";
import { CountdownTimer } from "./CountdownTimer";

export function MainApp() {
  const { signOut } = useAuthActions();
  const [showCamera, setShowCamera] = useState(false);
  const hasPosted = useQuery(api.stamps.hasPostedInCurrentWindow);
  const stats = useQuery(api.stamps.getStats);
  const windowInfo = useQuery(api.stamps.getCurrentWindow);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl rotate-6 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Camera className="w-5 h-5 text-white -rotate-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">WORLDSTAMP</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Stats badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-medium text-white/70">
                  {stats?.currentWindowCount ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <Image className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-white/70">
                  {stats?.totalStamps ?? 0}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut()}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 text-white/50" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content - Globe */}
      <main className="flex-1 relative pt-20 pb-32">
        <GlobeView />
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Timer */}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next window in</span>
                </div>
                <CountdownTimer windowInfo={windowInfo} />
              </div>

              {/* Camera Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCamera(true)}
                disabled={hasPosted === true}
                className={`relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg transition-all ${
                  hasPosted
                    ? "bg-white/10 cursor-not-allowed"
                    : "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 shadow-violet-500/30 hover:shadow-violet-500/50"
                }`}
              >
                {hasPosted ? (
                  <div className="text-center">
                    <span className="text-white/50 text-xs">Done!</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-white" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0f]"
                    />
                  </>
                )}
              </motion.button>

              {/* Stats on mobile */}
              <div className="flex-1 sm:hidden">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-violet-400" />
                    <span className="text-xs font-medium text-white/70">
                      {stats?.currentWindowCount ?? 0} now
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs font-medium text-white/70">
                      {stats?.totalStamps ?? 0} total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraCapture onClose={() => setShowCamera(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
