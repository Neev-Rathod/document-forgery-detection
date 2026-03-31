import { useState } from "react";
import { Layers, RotateCw } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Component for displaying ELA forgery detection results with ForensicReport styling
 */
export default function ELADetectionResults({ result, file, onBack }) {
  const [currentImage, setCurrentImage] = useState("original"); // "original" or "ela"

  if (!result) return null;

  const isForged = result.is_forged;
  const confidence = result.confidence;
  const tamperProbability = result.tamper_probability;
  const authenticProbability = result.authentic_probability;

  const riskLevel = isForged ? "high" : "low";
  const finalVerdict = isForged ? "FORGED - Tampering Detected" : "AUTHENTIC";

  const displayConfidence = (confidence * 100).toFixed(0);
  const isHighRisk = isForged;

  return (
    <div className="flex-1 min-h-screen bg-[#060b0d] text-white p-8 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-cyan-400/60 text-xs font-bold uppercase tracking-widest mb-1">
            ELA Analysis › {file?.name || "Image Analysis"}
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Error Level Analysis Results
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/40 text-sm underline underline-offset-4 decoration-white/10">
              Method: ELA + EfficientNet-B4
            </span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Analyze Another Image
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Scores & Verdict */}
        <div className="col-span-4 space-y-8">
          {/* Authenticity Score Circle */}
          <div className="bg-[#0b1619] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div
              className={`absolute top-0 right-0 w-32 h-32 ${isHighRisk ? "bg-red-500/10" : "bg-emerald-500/10"} blur-3xl rounded-full -mr-16 -mt-16`}
            />
            <div className="flex items-center justify-between mb-6">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                Tamper Detection Score
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isHighRisk ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
              >
                {riskLevel} Risk
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    className="stroke-[#132328]"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: confidence }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="56"
                    cy="56"
                    r="50"
                    className={
                      isHighRisk ? "stroke-red-500/80" : "stroke-emerald-500/80"
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="314.159"
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 12px ${isHighRisk ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"})`,
                    }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-white">
                    {displayConfidence}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h4
                  className={`font-black text-lg mb-1 leading-tight ${isHighRisk ? "text-red-500" : "text-emerald-500"}`}
                >
                  {finalVerdict}
                </h4>
                <p className="text-white/40 text-xs leading-relaxed">
                  {isHighRisk
                    ? "Image shows compression artifacts characteristic of tampering."
                    : "Image shows consistent compression patterns indicating authenticity."}
                </p>
              </div>
            </div>
          </div>

          {/* Probability Scores */}
          <div className="bg-[#0b1619] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">
              Detection Probabilities
            </p>
            <div className="space-y-4">
              {/* Tamper Probability */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">
                    Tampering Detected
                  </span>
                  <span className="text-red-400 font-bold">
                    {(tamperProbability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tamperProbability * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-red-500 rounded-full"
                  />
                </div>
              </div>

              {/* Authentic Probability */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Authentic Image</span>
                  <span className="text-emerald-400 font-bold">
                    {(authenticProbability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${authenticProbability * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Info */}
          <div className="bg-[#0b1619] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">
              File Information
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-white/50 text-xs mb-1">File Name</p>
                <p className="text-white font-mono text-sm truncate">
                  {file?.name || "N/A"}
                </p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-white/50 text-xs mb-1">Analysis Method</p>
                <p className="text-white text-sm">ELA + EfficientNet-B4</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-white/50 text-xs mb-1">Model Accuracy</p>
                <p className="text-white text-sm">96-99%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Image Viewer */}
        <div className="col-span-8 space-y-8">
          {/* Document Forensic Viewport */}
          <div className="bg-[#0b1619] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  Visualization Viewer
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentImage("original")}
                  className={`px-3 py-1 text-xs rounded-md border transition-all ${
                    currentImage === "original"
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "border-white/15 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setCurrentImage("ela")}
                  className={`px-3 py-1 text-xs rounded-md border transition-all ${
                    currentImage === "ela"
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "border-white/15 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  ELA Map
                </button>
              </div>
            </div>

            <div className="bg-[#122227] rounded-xl relative overflow-hidden aspect-video flex items-center justify-center p-8">
              <div className="relative bg-white w-full h-full shadow-2xl border-4 border-[#1a3a44]/50 pointer-events-none overflow-hidden">
                {currentImage === "original" ? (
                  <>
                    <img
                      src={result.original_preview}
                      className="w-full h-full object-contain mix-blend-multiply opacity-90"
                      alt="Original Image"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-xs font-medium">
                        Original Image
                      </p>
                      <p className="text-white/60 text-[11px] mt-1">
                        Original document before analysis
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={result.ela_preview}
                      className="w-full h-full object-contain mix-blend-multiply opacity-90"
                      alt="ELA Map"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-xs font-medium">ELA Map</p>
                      <p className="text-white/60 text-[11px] mt-1">
                        Bright areas indicate potential compression artifacts
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* How ELA Works */}
          <div className="bg-[#0b1619] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">
              About Error Level Analysis
            </p>
            <p className="text-white/70 text-sm leading-relaxed">
              Error Level Analysis (ELA) detects compression artifacts in
              images. When an image is modified, the recompressed area shows
              different error levels than the unmodified regions. The ELA map
              highlights these differences, with brighter areas indicating
              potential tampering or unauthorized modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
