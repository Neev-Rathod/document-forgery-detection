import { useState } from "react";
import { CheckCircle, AlertCircle, Copy, Check } from "lucide-react";

/**
 * Component for displaying ELA forgery detection results and visualizations
 */
export default function ELADetectionResults({ result, file, onBack }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!result) return null;

  const isForged = result.is_forged;
  const confidence = result.confidence;
  const verdictColor = isForged ? "text-red-400" : "text-emerald-400";
  const verdictBg = isForged
    ? "bg-red-500/10 border-red-500/30"
    : "bg-emerald-500/10 border-emerald-500/30";
  const verdictIcon = isForged ? (
    <AlertCircle className="w-6 h-6" />
  ) : (
    <CheckCircle className="w-6 h-6" />
  );

  return (
    <div className="space-y-6">
      {/* Verdict Card */}
      <div className={`border rounded-xl p-6 ${verdictBg} backdrop-blur-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={verdictColor}>{verdictIcon}</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {isForged ? "⚠️ TAMPERED" : "✅ AUTHENTIC"}
              </h2>
              <p className="text-white/60 text-sm">
                {isForged
                  ? "Image shows signs of tampering or forgery"
                  : "Image appears to be authentic"}
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white transition-colors text-sm px-3 py-1 rounded border border-white/10 hover:border-white/20"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
            Tamper Probability
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400">
              {(result.tamper_probability * 100).toFixed(1)}%
            </span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${result.tamper_probability * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
            Authentic Probability
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {(result.authentic_probability * 100).toFixed(1)}%
            </span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${result.authentic_probability * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Visualizations</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Original Image */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={result.original_preview}
                alt="Original"
                className="w-full h-auto"
              />
            </div>
            <div className="p-3 border-t border-white/10">
              <p className="text-xs font-mono text-white/60">Original Image</p>
              {file && (
                <p className="text-xs text-white/40 mt-1 truncate">
                  {file.name}
                </p>
              )}
            </div>
          </div>

          {/* ELA Map */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={result.ela_preview}
                alt="ELA Map"
                className="w-full h-auto"
              />
            </div>
            <div className="p-3 border-t border-white/10">
              <p className="text-xs font-mono text-white/60">
                ELA Map (Compression Artifacts)
              </p>
              <p className="text-xs text-white/40 mt-1">
                Bright areas indicate potential tampering
              </p>
            </div>
          </div>

          {/* Tamper Mask */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={result.mask_preview}
                alt="Tamper Mask"
                className="w-full h-auto"
              />
            </div>
            <div className="p-3 border-t border-white/10">
              <p className="text-xs font-mono text-white/60">
                Binary Tamper Mask
              </p>
              <p className="text-xs text-white/40 mt-1">
                White = Suspicious regions
              </p>
            </div>
          </div>

          {/* Masked Overlay */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={result.masked_preview}
                alt="Masked Overlay"
                className="w-full h-auto"
              />
            </div>
            <div className="p-3 border-t border-white/10">
              <p className="text-xs font-mono text-white/60">
                Suspicious Regions Highlighted
              </p>
              <p className="text-xs text-white/40 mt-1">
                Red overlay shows detected tampering areas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Technical Details</h3>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <DetailRow
            label="Method"
            value="ELA + EfficientNet-B4"
            onCopy={() => copyToClipboard("ELA + EfficientNet-B4", "method")}
            copied={copied === "method"}
          />
          <DetailRow
            label="Model"
            value="forgery_detector_full.pth"
            onCopy={() => copyToClipboard("forgery_detector_full.pth", "model")}
            copied={copied === "model"}
          />
          <DetailRow
            label="Training Data"
            value="CASIA 2.0 (12,615 images)"
            onCopy={() =>
              copyToClipboard("CASIA 2.0 - 12,615 images", "training")
            }
            copied={copied === "training"}
          />
          <DetailRow
            label="Expected Accuracy"
            value="96-99%"
            onCopy={() => copyToClipboard("96-99%", "accuracy")}
            copied={copied === "accuracy"}
          />
          <DetailRow
            label="Input Size"
            value="224×224 (ELA Map)"
            onCopy={() => copyToClipboard("224×224", "input")}
            copied={copied === "input"}
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">How It Works</h3>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-xs font-bold text-cyan-400">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Error Level Analysis (ELA)
              </p>
              <p className="text-xs text-white/60 mt-1">
                Re-compresses image at 90% quality and detects compression
                artifacts
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-xs font-bold text-cyan-400">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Feature Extraction
              </p>
              <p className="text-xs text-white/60 mt-1">
                ELA map processed through EfficientNet-B4 backbone (1792
                features)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-xs font-bold text-cyan-400">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-white">Classification</p>
              <p className="text-xs text-white/60 mt-1">
                Custom classifier head predicts authentic (0) or tampered (1)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-xs font-bold text-cyan-400">
              4
            </div>
            <div>
              <p className="text-sm font-medium text-white">Visualization</p>
              <p className="text-xs text-white/60 mt-1">
                Generates tamper mask highlighting suspicious regions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <p className="text-xs text-amber-400">
          ⚠️ <strong>Note:</strong> This detection method uses AI and should not
          be considered definitive forensic proof. For legal and official
          purposes, consult qualified forensic experts.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, onCopy, copied }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
      <span className="text-xs uppercase tracking-widest text-white/50">
        {label}
      </span>
      <button
        onClick={onCopy}
        className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors group"
      >
        <span className="font-mono text-violet-300">{value}</span>
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </div>
  );
}
