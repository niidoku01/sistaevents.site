
import React, { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import { Box, Download } from "lucide-react";
import { ELEMENT_DEFS, VENUE_BACKGROUNDS, GRID_SIZE, snap, uid } from "./planner/constants";
import { calculateTotalGuests, autoArrange, detectDevicePerf, trackUsage } from "./planner/utils";
import { usePlannerHistory } from "./planner/hooks/usePlannerHistory";
import { usePlannerDrag } from "./planner/hooks/usePlannerDrag";
import { usePlannerResize } from "./planner/hooks/usePlannerResize";
import { useKeyboardShortcuts } from "./planner/hooks/useKeyboardShortcuts";
import { useBreakpoint } from "./planner/hooks/useBreakpoint";
import PlannerToolbar from "./planner/components/PlannerToolbar";
import ElementSidebar from "./planner/components/ElementSidebar";
import PlannerCanvas from "./planner/components/PlannerCanvas";
import type { PlacedElement, ElementType } from "./planner/types";

const Venue3DView = lazy(() => import("./studio/viewport/Venue3D"));
const Venue3DFullscreen = lazy(() => import("./planner/components/Venue3DFullscreen"));

const EventPlanner: React.FC = () => {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const {
    elements, setElements, historyIdx, history,
    pushHistory, undo, redo, canUndo, canRedo,
  } = usePlannerHistory();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [eventName, setEventName] = useState("My Event");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "layers">("elements");
  const [elementSearch, setElementSearch] = useState("");
  const [show3D, setShow3D] = useState(() => !isMobile);
  const [showFullscreen3D, setShowFullscreen3D] = useState(false);
  const [perspective3D, setPerspective3D] = useState({ rotateX: 45, rotateZ: -30 });
  const [venueBg, setVenueBg] = useState("default");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [labelInput, setLabelInput] = useState<{ id: string; value: string } | null>(null);
  const [rotationInput, setRotationInput] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const screenshot3DRef = useRef<(() => string) | null>(null);

  // Derived single-select for hooks that still expect it
  const selectedId = selectedIds[0] ?? null;
  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : []);
  }, []);

  // Close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // ─── Element operations ──────────────────────────────────
  const rotateBy = useCallback((id: string, deg: number) => {
    const next = elements.map((el) => el.id === id ? { ...el, rotation: ((el.rotation + deg) % 360 + 360) % 360 } : el);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  const rotateTo = useCallback((id: string, deg: number) => {
    const next = elements.map((el) => el.id === id ? { ...el, rotation: ((deg % 360) + 360) % 360 } : el);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  const flipElement = useCallback((id: string, axis: "h" | "v") => {
    if (axis === "h") {
      const next = elements.map((e) => e.id === id ? { ...e, rotation: (180 - e.rotation + 360) % 360 } : e);
      setElements(next); pushHistory(next);
    } else {
      const next = elements.map((e) => e.id === id ? { ...e, rotation: (360 - e.rotation) % 360 } : e);
      setElements(next); pushHistory(next);
    }
  }, [elements, setElements, pushHistory]);

  const nudgeElement = useCallback((id: string, dx: number, dy: number) => {
    const next = elements.map((e) => e.id === id ? { ...e, x: e.x + dx, y: e.y + dy } : e);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  const updateGuests = useCallback((id: string, delta: number) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const current = el.guests ?? (el.type === "round-table" ? 10 : 8);
    const next = elements.map((e) => e.id === id ? { ...e, guests: Math.max(8, Math.min(12, current + delta)) } : e);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  const moveLayer = useCallback((id: string, dir: number) => {
    setElements((prev) => {
      const sorted = [...prev].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      const idx = sorted.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = { ...sorted[swapIdx], zIndex: sorted[idx].zIndex ?? idx };
      const b = { ...sorted[idx], zIndex: sorted[swapIdx].zIndex ?? swapIdx };
      sorted[swapIdx] = b; sorted[idx] = a;
      const next = sorted.map((el, i) => ({ ...el, zIndex: i }));
      pushHistory(next);
      return next;
    });
  }, [setElements, pushHistory]);

  const bringForward = useCallback(() => { if (selectedId) moveLayer(selectedId, 1); }, [selectedId, moveLayer]);
  const sendBackward = useCallback(() => { if (selectedId) moveLayer(selectedId, -1); }, [selectedId, moveLayer]);
  const bringToFront = useCallback(() => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map((e) => e.zIndex ?? 0), 0);
    const next = elements.map((e) => e.id === selectedId ? { ...e, zIndex: maxZ + 1 } : e);
    setElements(next); pushHistory(next);
  }, [selectedId, elements, setElements, pushHistory]);
  const sendToBack = useCallback(() => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map((e) => e.zIndex ?? 0), 0);
    const next = elements.map((e) => e.id === selectedId ? { ...e, zIndex: minZ - 1 } : e);
    setElements(next); pushHistory(next);
  }, [selectedId, elements, setElements, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const next = elements.filter((el) => !selectedIds.includes(el.id));
    setElements(next); pushHistory(next); setSelectedIds([]);
  }, [selectedIds, elements, setElements, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newIds: string[] = [];
    let next = [...elements];
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id);
      if (!el) continue;
      const newId = uid();
      const dup = { ...el, id: newId, x: el.x + 20, y: el.y + 20 };
      next = [...next, dup];
      newIds.push(newId);
      trackUsage(el.type);
    }
    setElements(next); pushHistory(next); setSelectedIds(newIds);
  }, [selectedIds, elements, setElements, pushHistory]);

  const startEditLabel = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find((el) => el.id === selectedId);
    if (!el) return;
    const def = ELEMENT_DEFS.find((d) => d.type === el.type);
    setLabelInput({ id: selectedId, value: el.label || def?.label || "" });
  }, [selectedId, elements]);

  const commitLabel = useCallback(() => {
    if (!labelInput) return;
    const next = elements.map((el) => el.id === labelInput.id ? { ...el, label: labelInput.value } : el);
    setElements(next); pushHistory(next); setLabelInput(null);
  }, [labelInput, elements, setElements, pushHistory]);

  const handleCanvasClick = useCallback(() => {
    setSelectedIds([]); setLabelInput(null); setRotationInput(false);
  }, []);

  const onElementDoubleClick = useCallback((_id: string) => {}, []);

  // ─── Lock / Group ────────────────────────────────────────
  const onToggleLock = useCallback((id: string) => {
    const next = elements.map((el) => el.id === id ? { ...el, locked: !(el.locked ?? false) } : el);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  const onGroup = useCallback(() => {
    if (selectedIds.length < 2) return;
    const groupId = uid();
    const next = elements.map((el) => selectedIds.includes(el.id) ? { ...el, groupId } : el);
    setElements(next); pushHistory(next);
  }, [selectedIds, elements, setElements, pushHistory]);

  const onUngroup = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (!el?.groupId) return;
    const gid = el.groupId;
    const next = elements.map((e) => e.groupId === gid ? { ...e, groupId: undefined } : e);
    setElements(next); pushHistory(next);
  }, [selectedId, elements, setElements, pushHistory]);

  const onToggleSnap = useCallback(() => setSnapEnabled((v) => !v), []);
  const onToggleGuides = useCallback(() => setGuidesEnabled((v) => !v), []);

  // ─── Hooks ───────────────────────────────────────────────
  const {
    dragFromPalette, guides, handlePaletteDragStart,
    handleCanvasDrop, handleCanvasDragOver, handleDragStart,
  } = usePlannerDrag({ elements, setElements, pushHistory, setSelectedId, scale, canvasRef, uid });

  const {
    lockAspect, setLockAspect, handleResizeStart,
    resizeElement, scaleElement, setElementSize,
  } = usePlannerResize({ elements, setElements, pushHistory, selectedId, setSelectedId, scale });

  useKeyboardShortcuts({
    selectedId, setSelectedId, elements, setElements, pushHistory,
    undo, redo, canUndo, canRedo,
    labelInput, setLabelInput, rotationInput, setRotationInput,
    moveLayer, nudgeElement, resizeElement, rotateBy, flipElement, uid,
    onToggleLock, onGroup, onUngroup,
  });

  // ─── Derived state ───────────────────────────────────────
  const selectedEl = useMemo(() => elements.find((el) => el.id === selectedId), [elements, selectedId]);
  const selectedDef = useMemo(() => selectedEl ? ELEMENT_DEFS.find((d) => d.type === selectedEl.type) : null, [selectedEl]);
  const isTable = useMemo(() => selectedEl ? (selectedEl.type === "round-table" || selectedEl.type === "rect-table") : false, [selectedEl]);
  const totalGuests = useMemo(() => calculateTotalGuests(elements), [elements]);

  // ─── Tap-to-add (mobile) ─────────────────────────────────
  const handlePaletteTap = useCallback((type: ElementType) => {
    const def = ELEMENT_DEFS.find((d) => d.type === type);
    if (!def) return;
    const container = canvasRef.current;
    let cx = 400, cy = 300;
    if (container) {
      cx = (container.clientWidth / 2) / scale - def.defaultWidth / 2;
      cy = (container.clientHeight / 2) / scale - def.defaultHeight / 2;
    }
    const newEl: PlacedElement = { id: uid(), type, x: snap(cx), y: snap(cy), width: def.defaultWidth, height: def.defaultHeight, rotation: 0, color: def.color, guests: def.defaultGuests };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
    setSelectedIds([newEl.id]);
    trackUsage(type);
  }, [elements, setElements, pushHistory, setSelectedIds, scale, canvasRef, uid]);
  const sortedElements = useMemo(() => [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)), [elements]);
  const currentBg = useMemo(() => VENUE_BACKGROUNDS.find((b) => b.id === venueBg) || VENUE_BACKGROUNDS[0], [venueBg]);

  // ─── Auto-arrange ────────────────────────────────────────
  const handleAutoArrange = useCallback(() => {
    if (elements.length === 0) return;
    const next = autoArrange(elements);
    setElements(next); pushHistory(next);
  }, [elements, setElements, pushHistory]);

  // ─── Save / Load / Export ────────────────────────────────
  const savePlan = useCallback(() => {
    try {
      localStorage.setItem("event-planner-save", JSON.stringify({ eventName, elements, scale, savedAt: new Date().toISOString() }));
    } catch {}
  }, [eventName, elements, scale]);

  const loadPlan = useCallback(() => {
    try {
      const raw = localStorage.getItem("event-planner-save");
      if (!raw) return;
      const data = JSON.parse(raw);
      setElements(data.elements || []);
      setEventName(data.eventName || "My Event");
      pushHistory(data.elements || []);
    } catch {}
  }, [setElements, pushHistory]);

  useEffect(() => { loadPlan(); }, []);

  useEffect(() => {
    const perf = detectDevicePerf();
    if (perf === "low") setShowGrid(false);
  }, []);

  const clearAll = useCallback(() => {
    if (confirm("Clear the entire floor plan?")) {
      setElements([]); pushHistory([]);
    }
  }, [setElements, pushHistory]);

  const exportPNG = useCallback(() => {
    if (!canvasRef.current) return;
    const es = 2;
    const cw = canvasRef.current.scrollWidth, ch = canvasRef.current.scrollHeight;
    const canvas = document.createElement("canvas");
    canvas.width = cw * es; canvas.height = ch * es;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(es, es);
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, cw, ch);
    if (showGrid) {
      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 0.5;
      for (let x = 0; x < cw; x += GRID_SIZE * scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
      for (let y = 0; y < ch; y += GRID_SIZE * scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
    }
    const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    sorted.forEach((el) => {
      const def = ELEMENT_DEFS.find((d) => d.type === el.type);
      const ex = el.x * scale, ey = el.y * scale, ew = el.width * scale, eh = el.height * scale;
      ctx.save(); ctx.translate(ex + ew / 2, ey + eh / 2); ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = el.color || def?.color || "#999";
      if (el.type === "round-table" || el.type === "cake-table") {
        ctx.beginPath(); ctx.arc(0, 0, ew / 2, 0, Math.PI * 2); ctx.fill();
        if (el.type === "round-table") {
          const n = el.guests ?? 10; const step = (2 * Math.PI) / n;
          for (let i = 0; i < n; i++) { const a = i * step - Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * ew * 0.56, Math.sin(a) * eh * 0.56, 3, 0, Math.PI * 2); ctx.fillStyle = "#9ca3af"; ctx.fill(); }
        }
      } else if (el.type === "dance-floor") {
        const ts = Math.max(6, Math.min(ew, eh) / 12);
        for (let tx = -ew / 2; tx < ew / 2; tx += ts) { for (let ty = -eh / 2; ty < eh / 2; ty += ts) {
          const dk = (Math.floor((tx + ew / 2) / ts) + Math.floor((ty + eh / 2) / ts)) % 2 === 0;
          ctx.fillStyle = dk ? "#1f2937" : "#d1d5db"; ctx.fillRect(tx, ty, ts, ts);
        }}
      } else {
        ctx.beginPath(); ctx.roundRect(-ew / 2, -eh / 2, ew, eh, 4); ctx.fill();
      }
      ctx.fillStyle = "#fff"; ctx.font = `${Math.max(7, Math.min(10, ew / 10))}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(el.label || def?.label || "", 0, 0);
      ctx.restore();
    });
    ctx.fillStyle = "#1e293b"; ctx.font = "bold 16px system-ui, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(eventName, 12, 20);
    const link = document.createElement("a");
    link.download = `${eventName.replace(/\s+/g, "-").toLowerCase()}-floorplan.png`;
    link.href = canvas.toDataURL("image/png"); link.click();
  }, [elements, scale, showGrid, eventName]);

  const export3D = useCallback(() => {
    if (!screenshot3DRef.current) return;
    const dataUrl = screenshot3DRef.current();
    const link = document.createElement("a");
    link.download = `${eventName.replace(/\s+/g, "-").toLowerCase()}-3d-view.png`;
    link.href = dataUrl;
    link.click();
  }, [eventName]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-200/60 bg-white overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-5 sm:py-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate">Floor Planner</h1>
          </div>
          <div className="flex-1" />
          <PlannerToolbar
            eventName={eventName} setEventName={setEventName} totalGuests={totalGuests}
            scale={scale} setScale={setScale} showGrid={showGrid} setShowGrid={setShowGrid}
            show3D={show3D} setShow3D={setShow3D} venueBg={venueBg} setVenueBg={setVenueBg}
            showBgPicker={showBgPicker} setShowBgPicker={setShowBgPicker}
            undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
            handleAutoArrange={handleAutoArrange} savePlan={savePlan} exportPNG={exportPNG} clearAll={clearAll}
            currentBg={currentBg}
            onPreview3D={() => setShowFullscreen3D(true)}
            compact={isMobile}
          />
        </div>
      </div>

      {/* ─── Main canvas area ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <ElementSidebar
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
          sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
          elementSearch={elementSearch} setElementSearch={setElementSearch}
          handlePaletteDragStart={handlePaletteDragStart}
          handlePaletteTap={handlePaletteTap}
          sortedElements={sortedElements} selectedId={selectedId} setSelectedId={setSelectedId} elements={elements}
        />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <PlannerCanvas
            canvasRef={canvasRef} showGrid={showGrid}
            elements={elements} sortedElements={sortedElements}
            selectedIds={selectedIds} selectedEl={selectedEl} selectedDef={selectedDef}
            isTable={isTable} scale={scale} guides={guides}
            dragFromPalette={dragFromPalette}
            snapEnabled={snapEnabled} guidesEnabled={guidesEnabled}
            setSelectedIds={setSelectedIds} handleDragStart={handleDragStart} handleResizeStart={handleResizeStart}
            onElementDoubleClick={onElementDoubleClick}
            handleCanvasClick={handleCanvasClick} handleCanvasDrop={handleCanvasDrop} handleCanvasDragOver={handleCanvasDragOver}
            labelInput={labelInput} setLabelInput={setLabelInput} commitLabel={commitLabel}
            rotateBy={rotateBy} rotateTo={rotateTo} flipElement={flipElement}
            setElementSize={setElementSize} scaleElement={scaleElement}
            lockAspect={lockAspect} setLockAspect={setLockAspect}
            undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
            sendBackward={sendBackward} bringForward={bringForward}
            sendToBack={sendToBack} bringToFront={bringToFront}
            duplicateSelected={duplicateSelected} startEditLabel={startEditLabel}
            deleteSelected={deleteSelected} updateGuests={updateGuests}
            onToggleLock={onToggleLock} onGroup={onGroup} onUngroup={onUngroup}
            onToggleSnap={onToggleSnap} onToggleGuides={onToggleGuides}
            setScale={setScale}
          />

          {show3D && !isMobile && (
            <div className="w-full md:w-1/2 flex-shrink-0 rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.08)]" style={{ minHeight: 200 }}>
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">3D Live</span>
              </div>
              <Suspense fallback={
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3"></div>
                  <span className="text-xs text-white/40 font-medium tracking-wide">Loading 3D scene...</span>
                </div>
              }>
                <Venue3DView
                  elements={elements}
                  rotateX={perspective3D.rotateX}
                  rotateZ={perspective3D.rotateZ}
                  showStudioControls={false}
                  onScreenshotReady={(fn) => { screenshot3DRef.current = fn; }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3D Controls (below canvas) ──────────────────── */}
      {show3D && !isMobile && (
        <div className="flex-shrink-0 border-t border-slate-200/40 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-2 py-2 sm:px-6 sm:py-3 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-5 flex-nowrap min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Box className="w-4 h-4 text-purple-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">3D</span>
            </div>
            <div className="h-4 w-px bg-slate-200 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">Tilt</span>
              <input type="range" min={20} max={80} value={perspective3D.rotateX}
                onChange={(e) => setPerspective3D((p) => ({ ...p, rotateX: +e.target.value }))}
                className="w-16 sm:w-28 h-1.5 accent-purple-500 rounded-full" />
              <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{perspective3D.rotateX}&deg;</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">Rotate</span>
              <input type="range" min={-180} max={180} value={perspective3D.rotateZ}
                onChange={(e) => setPerspective3D((p) => ({ ...p, rotateZ: +e.target.value }))}
                className="w-16 sm:w-28 h-1.5 accent-purple-500 rounded-full" />
              <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{perspective3D.rotateZ}&deg;</span>
            </div>
            <button
              className="text-[10px] text-purple-500 hover:text-purple-700 font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
              onClick={() => setPerspective3D({ rotateX: 45, rotateZ: -30 })}
            >
              Reset
            </button>
            <div className="h-4 w-px bg-slate-200 flex-shrink-0" />
            <button
              className="flex items-center gap-1.5 text-[10px] text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 active:scale-95 flex-shrink-0"
              onClick={export3D}
              title="Download 3D view as PNG"
            >
              <Download className="w-3 h-3" />
              Download 3D
            </button>
            <span className="text-[9px] text-slate-300 ml-auto hidden sm:inline italic">2D edits update 3D in real time</span>
          </div>
        </div>
      )}

      {/* ─── Keyboard hints (desktop only) ───────────────── */}
      {!isMobile && (
        <div className="flex-shrink-0 text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 px-5 py-2 border-t border-slate-100 bg-white">
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Del</kbd> Delete</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">R</kbd> Rotate 45&deg;</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Ctrl+D</kbd> Duplicate</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Ctrl+L</kbd> Lock</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Ctrl+G</kbd> Group</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Arrows</kbd> Nudge</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Right-click</kbd> Context menu</span>
        </div>
      )}

      {/* ─── Fullscreen 3D Preview ────────────────────────── */}
      {showFullscreen3D && (
        <Suspense fallback={null}>
          <Venue3DFullscreen
            elements={elements}
            eventName={eventName}
            totalGuests={totalGuests}
            onClose={() => setShowFullscreen3D(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default EventPlanner;
