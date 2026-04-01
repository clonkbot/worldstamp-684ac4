import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock } from "lucide-react";

interface Stamp {
  _id: string;
  imageUrl: string;
  userName?: string;
  latitude: number;
  longitude: number;
  createdAt: number;
}

export function GlobeView() {
  const stamps = useQuery(api.stamps.listAll);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to position on the map
  const latLngToPosition = (lat: number, lng: number) => {
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.globe-surface')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[calc(100vh-8rem)] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Globe surface */}
      <motion.div
        className="globe-surface absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* World map background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[90vw] max-w-4xl aspect-[2/1]">
            {/* Map base */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-cyan-900/20 rounded-3xl border border-white/5 overflow-hidden">
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 50">
                {/* Latitude lines */}
                {[...Array(9)].map((_, i) => (
                  <line
                    key={`lat-${i}`}
                    x1="0"
                    y1={(i + 1) * 5}
                    x2="100"
                    y2={(i + 1) * 5}
                    stroke="white"
                    strokeWidth="0.1"
                  />
                ))}
                {/* Longitude lines */}
                {[...Array(19)].map((_, i) => (
                  <line
                    key={`lng-${i}`}
                    x1={(i + 1) * 5}
                    y1="0"
                    x2={(i + 1) * 5}
                    y2="50"
                    stroke="white"
                    strokeWidth="0.1"
                  />
                ))}
              </svg>

              {/* Continents (simplified shapes) */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 50" preserveAspectRatio="none">
                {/* North America */}
                <path d="M10,8 L25,8 L28,15 L25,22 L18,25 L12,22 L8,15 Z" fill="url(#continentGradient)" />
                {/* South America */}
                <path d="M20,28 L28,26 L30,32 L28,40 L22,45 L18,38 Z" fill="url(#continentGradient)" />
                {/* Europe */}
                <path d="M45,10 L55,8 L58,12 L52,18 L45,16 Z" fill="url(#continentGradient)" />
                {/* Africa */}
                <path d="M45,20 L55,18 L60,25 L58,35 L50,40 L42,35 L40,25 Z" fill="url(#continentGradient)" />
                {/* Asia */}
                <path d="M58,8 L85,6 L90,15 L85,25 L70,28 L60,22 L58,15 Z" fill="url(#continentGradient)" />
                {/* Australia */}
                <path d="M78,32 L88,30 L92,35 L88,42 L80,42 L76,38 Z" fill="url(#continentGradient)" />
                <defs>
                  <linearGradient id="continentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Stamps */}
            {stamps?.map((stamp: Stamp, index: number) => {
              const pos = latLngToPosition(stamp.latitude, stamp.longitude);
              return (
                <motion.button
                  key={stamp._id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.02, type: "spring" }}
                  onClick={() => setSelectedStamp(stamp)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <div className="relative">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-violet-500/50 rounded-lg blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Stamp image */}
                    <div className="relative w-8 h-8 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg group-hover:border-violet-400 group-hover:scale-125 transition-all duration-200">
                      <img
                        src={stamp.imageUrl}
                        alt="Stamp"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Ping effect */}
                    <motion.div
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-violet-500/30 rounded-lg"
                    />
                  </div>
                </motion.button>
              );
            })}

            {/* Empty state */}
            {stamps?.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm">No stamps yet</p>
                  <p className="text-white/20 text-xs mt-1">Be the first to stamp!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Zoom controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((prev) => Math.min(prev * 1.3, 5))}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((prev) => Math.max(prev * 0.7, 0.5))}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          −
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all text-xs font-mono"
        >
          1x
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10">
        <p className="text-white/30 text-xs font-mono">
          Drag to pan · Scroll to zoom · Click stamp to view
        </p>
      </div>

      {/* Stamp detail modal */}
      <AnimatePresence>
        {selectedStamp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedStamp(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedStamp(null)}
                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Card */}
              <div className="bg-gradient-to-br from-violet-900/50 to-cyan-900/50 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={selectedStamp.imageUrl}
                    alt="Stamp"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Info */}
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {selectedStamp.userName || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-white/50 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedStamp.latitude.toFixed(2)}°, {selectedStamp.longitude.toFixed(2)}°
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(selectedStamp.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
