import { useState, useMemo } from "react";
import FileUpload from "../components/FileUpload";
import ELADetectionResults from "../components/ELADetectionResults";
import { detectForgereyELA } from "../services/api";
import { Loader, AlertCircle } from "lucide-react";

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export default function ELADetection() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [elaResult, setElaResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const previewUrl = useMemo(() => {
    if (!file || !file.type?.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setStatus(STATUS.IDLE);
    setElaResult(null);
    setErrorMsg("");
  };

  const handleAnalyzeELA = async () => {
    if (!file) return;

    setStatus(STATUS.LOADING);
    setErrorMsg("");

    try {
      // Run ELA detection only (new model)
      const ela = await detectForgereyELA(file);
      setElaResult(ela);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMsg(err.message || "Analysis failed");
      setStatus(STATUS.ERROR);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus(STATUS.IDLE);
    setElaResult(null);
    setErrorMsg("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  if (status === STATUS.SUCCESS && elaResult) {
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            ELA Forgery Detection Results
          </h2>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
          >
            Analyze Another Image
          </button>
        </div>

        {/* ELA Results Component */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/5">
          <ELADetectionResults
            result={elaResult}
            file={file}
            onBack={handleReset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ELA-Based Forgery Detection
        </h2>
        <p className="text-white/60">
          Detect image tampering using Error Level Analysis (ELA) with
          EfficientNet-B4. Shows ELA map, tamper mask, and highlights suspicious
          regions.
        </p>
      </div>

      {/* File Upload */}
      <FileUpload onFileSelect={handleFileSelect} />

      {/* Preview and Analysis Container */}
      {file && (
        <div className="space-y-4">
          {/* Image Preview */}
          {previewUrl && file.type.startsWith("image/") && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
                Preview
              </p>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}

          {/* File Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-1">File Name</p>
              <p className="text-sm font-mono text-white truncate">
                {file.name}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-1">File Size</p>
              <p className="text-sm font-mono text-white">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Analysis Button */}
          {status === STATUS.LOADING ? (
            <button
              disabled
              className="w-full py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing with ELA + EfficientNet-B4...
            </button>
          ) : (
            <button
              onClick={handleAnalyzeELA}
              className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold transition-colors"
            >
              Start ELA Analysis
            </button>
          )}

          {/* Error Message */}
          {status === STATUS.ERROR && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm mb-1">
                  Analysis Failed
                </p>
                <p className="text-red-300/80 text-sm">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information Cards */}
      {!file && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                Error Level Analysis (ELA)
              </h4>
              <p className="text-white/60 text-sm">
                Re-compresses images to detect artifacts and compression
                patterns that indicate tampering or splicing.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">EfficientNet-B4</h4>
              <p className="text-white/60 text-sm">
                Advanced deep learning model trained on CASIA 2.0 dataset
                (12,615 images) with 96-99% accuracy on authentic vs tampered
                detection.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                Multiple Visualizations
              </h4>
              <p className="text-white/60 text-sm">
                View ELA maps, binary masks, and highlighted tamper regions to
                understand exactly where and how the forgery was detected.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Dual Comparison</h4>
              <p className="text-white/60 text-sm">
                Compare results with your original copy-move detector to
                validate findings and improve confidence in the verdict.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
