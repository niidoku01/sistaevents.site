import React, { useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ChevronUp, Circle, GripHorizontal } from "lucide-react";
import { ELEMENT_DEFS, CATEGORIES } from "../constants";
import { getFrequentTypes } from "../utils";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { PlacedElement, ElementType } from "../types";

interface ElementSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarTab: "elements" | "layers";
  setSidebarTab: (tab: "elements" | "layers") => void;
  elementSearch: string;
  setElementSearch: (v: string) => void;
  handlePaletteDragStart: (type: ElementType) => void;
  handlePaletteTap?: (type: ElementType) => void;
  sortedElements: PlacedElement[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  elements: PlacedElement[];
}

export default function ElementSidebar({
  sidebarOpen, setSidebarOpen,
  sidebarTab, setSidebarTab,
  elementSearch, setElementSearch,
  handlePaletteDragStart, handlePaletteTap,
  sortedElements, selectedId, setSelectedId, elements,
}: ElementSidebarProps) {
  const bp = useBreakpoint();
  const sheetRef = useRef<HTMLDivElement>(null);

  const frequentTypes = useMemo(() => getFrequentTypes(), [elements]);
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen || bp === "desktop") return;
    const onClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    const t = setTimeout(() => window.addEventListener("mousedown", onClick), 50);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", onClick); };
  }, [sidebarOpen, bp, setSidebarOpen]);

  const renderPaletteItem = (def: typeof ELEMENT_DEFS[0]) => {
    const Icon = def.icon;
    return (
      <div key={def.type} draggable onDragStart={() => handlePaletteDragStart(def.type)}
        onClick={() => handlePaletteTap?.(def.type)}
        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-100/80 hover:border-indigo-200 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-purple-50/30 cursor-grab active:cursor-grabbing transition-all duration-200 select-none group hover:shadow-sm hover:scale-[1.02] active:scale-95">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: def.color + "12" }}>
          <Icon className="w-4.5 h-4.5" style={{ color: def.color }} />
        </div>
        <span className="text-[9px] text-slate-600 text-center leading-tight font-medium">{def.label}</span>
      </div>
    );
  };

  const paletteContent = (
    <>
      {sidebarTab === "elements" && (<>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input value={elementSearch} onChange={(e) => setElementSearch(e.target.value)} placeholder="Search elements..."
            className="h-8 text-xs pl-8 rounded-xl border-slate-200/80 focus:border-indigo-400 focus:ring-indigo-400/20 bg-slate-50/50" />
        </div>

        {frequentTypes.length > 0 && !elementSearch.trim() && (
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Frequently Used</p>
            <div className="grid grid-cols-2 gap-1.5">
              {frequentTypes.map((type) => {
                const def = ELEMENT_DEFS.find((d) => d.type === type);
                if (!def) return null;
                return renderPaletteItem(def);
              })}
            </div>
          </div>
        )}

        {elementSearch.trim() ? (
          (() => {
            const q = elementSearch.toLowerCase();
            const filtered = ELEMENT_DEFS.filter((d) =>
              d.label.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
            );
            if (filtered.length === 0) return <p className="text-[10px] text-slate-400 text-center py-6">No elements found</p>;
            return (
              <div className="grid grid-cols-2 gap-1.5">
                {filtered.map((def) => renderPaletteItem(def))}
              </div>
            );
          })()
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{cat}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ELEMENT_DEFS.filter((d) => d.category === cat).map((def) => renderPaletteItem(def))}
              </div>
            </div>
          ))
        )}
      </>)}

      {sidebarTab === "layers" && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {sortedElements.length === 0 && <p className="text-[10px] text-slate-400 text-center py-6">No elements</p>}
          {[...sortedElements].reverse().map((el) => {
            const def = ELEMENT_DEFS.find((d) => d.type === el.type);
            const Icon = def?.icon || Circle;
            const isActive = selectedId === el.id;
            return (
              <div key={el.id} onClick={() => setSelectedId(el.id)}
                className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer text-[10px] transition-all duration-150
                  ${isActive
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent"
                  }`}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (def?.color || "#94a3b8") + "15" }}>
                  <Icon className="w-3 h-3" style={{ color: def?.color }} />
                </div>
                <span className={`truncate flex-1 ${isActive ? "font-semibold text-indigo-700" : "text-slate-600"}`}>{el.label || def?.label}</span>
                <span className="text-slate-400 text-[9px] font-mono">z{el.zIndex ?? 0}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // ─── Mobile + Tablet: overlay left panel ──────────────────
  if (isMobile || isTablet) {
    return (
      <>
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}
            className="fixed top-20 left-2 z-40 w-8 h-14 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        )}

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <div ref={sheetRef}
          className={`fixed z-50 top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-slate-100/60 rounded-xl p-0.5">
                <TabBtn active={sidebarTab === "elements"} onClick={() => setSidebarTab("elements")}>Elements</TabBtn>
                <TabBtn active={sidebarTab === "layers"} onClick={() => setSidebarTab("layers")}>Layers</TabBtn>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {paletteContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Desktop: inline sidebar ──────────────────────────────
  return (
    <div className={`${sidebarOpen ? "w-56" : "w-10"} transition-all duration-300 flex-shrink-0`}>
      <div className={`bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm h-full rounded-2xl ${sidebarOpen ? "" : "overflow-hidden"}`}>
        <div className="p-2 h-full">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-slate-100/60 rounded-xl p-0.5">
                  <TabBtn active={sidebarTab === "elements"} onClick={() => setSidebarTab("elements")}>Elements</TabBtn>
                  <TabBtn active={sidebarTab === "layers"} onClick={() => setSidebarTab("layers")}>Layers</TabBtn>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
                {paletteContent}
              </div>
            </div>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
              <span className="text-[9px]" style={{ writingMode: "vertical-rl" }}>Elements</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-all duration-150 ${active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
      {children}
    </button>
  );
}
