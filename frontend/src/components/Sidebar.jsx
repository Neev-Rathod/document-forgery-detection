import {
  Upload,
  FileSearch,
  History,
  ShieldCheck,
  LogOut,
  Wand2,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "forensic", label: "Forensic Reports", icon: FileSearch },
  { id: "ela", label: "ELA Detection", icon: Wand2 },
  { id: "history", label: "History", icon: History },
];

export default function Sidebar({ activeTab = "forensic", onTabChange }) {
  return (
    <aside className="w-64 bg-[#0a1215] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">
              ForgieShield
            </h1>
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold -mt-1 font-mono">
              Forensic AI
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
                }
              `}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-white/40"}`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
