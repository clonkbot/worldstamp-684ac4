import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { X, Camera, RotateCcw, Upload, MapPin, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  onClose: () => void;
}

export function CameraCapture({ onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [displayName, setDisplayName] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateUploadUrl = useMutation(api.stamps.generateUploadUrl);
  const createStamp = useMutation(api.stamps.create);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Use random location if geolocation fails
          setLocation({
            lat: Math.random() * 180 - 90,
            lng: Math.random() * 360 - 180,
          });
        }
      );
    } else {
      setLocation({
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360 - 180,
      });
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      setError("Could not access camera. Please allow camera permissions.");
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;

    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Upload and create stamp
  const handleUpload = async () => {
    if (!capturedImage || !location) return;

    setIsUploading(true);
    setError(null);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload to Convex
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResponse.json();

      // Create stamp
      await createStamp({
        storageId,
        latitude: location.lat,
        longitude: location.lng,
        displayName: displayName || undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload stamp");
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white font-semibold">Take Your Stamp</h2>
        <div className="w-10" />
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md aspect-square">
          {/* Decorative frame */}
          <div className="absolute -inset-4 border-2 border-dashed border-violet-500/30 rounded-3xl" />
          <div className="absolute -inset-2 border border-white/10 rounded-2xl" />

          {/* Camera/Preview */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
            {error && !capturedImage ? (
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div>
                  <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm">{error}</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-violet-500 rounded-lg text-white text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Location badge */}
            {location && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/20">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-white/70">
                  {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
                </span>
              </div>
            )}

            {/* Stamp frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Corner accents */}
                <path d="M0,5 L0,0 L5,0" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
                <path d="M95,0 L100,0 L100,5" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
                <path d="M100,95 L100,100 L95,100" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
                <path d="M5,100 L0,100 L0,95" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Name input */}
      {capturedImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-4"
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full max-w-md mx-auto block px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-center focus:outline-none focus:border-violet-500/50"
          />
        </motion.div>
      )}

      {/* Error display */}
      {error && capturedImage && (
        <div className="px-4 mb-4">
          <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg max-w-md mx-auto">
            {error}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="p-6 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6">
          {capturedImage ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={retakePhoto}
                className="p-4 bg-white/10 rounded-2xl border border-white/20"
              >
                <RotateCcw className="w-6 h-6 text-white/70" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Post Stamp
                  </>
                )}
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleCamera}
                className="p-4 bg-white/10 rounded-2xl border border-white/20"
              >
                <RotateCcw className="w-6 h-6 text-white/70" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                className="w-20 h-20 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/40"
              >
                <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </motion.button>

              <div className="w-14" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
