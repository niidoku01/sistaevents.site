import React, { useState, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  ArrowUp, ArrowDown, ChevronUp, ChevronDown,
  Copy, Trash2, Tag, Lock, Unlock,
  Grid3x3, Ruler, Layers, Ungroup,
  Minus, Plus,
} from "lucide-react";
import { ELEMENT_DEFS, GRID_SIZE } from "../constants";
import type { PlacedElement } from "../types";

interface ElementContextMenuProps {
  element: PlacedElement;
  selectedCount: number;
  children: React.ReactNode;
  onRotateBy: (id: string, deg: number) => void;
  onRotateTo: (id: string, deg: number) => void;
  onFlip: (id: string, axis: "h" | "v") => void;
  onScale: (id: string, factor: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onToggleSnap: () => void;
  onToggleGuides: () => void;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  onEditLabel: (id: string) => void;
}

export default function ElementContextMenu({
  element, selectedCount, children,
  onRotateBy, onRotateTo, onFlip, onScale,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onDuplicate, onDelete,
  onToggleLock, onGroup, onUngroup,
  onToggleSnap, onToggleGuides,
  snapEnabled, guidesEnabled,
  onEditLabel,
}: ElementContextMenuProps) {
  const [rotation, setRotation] = useState(element.rotation);

  useEffect(() => {
    setRotation(element.rotation);
  }, [element.rotation]);

  const def = ELEMENT_DEFS.find((d) => d.type === element.type);
  const isLocked = element.locked ?? false;
  const isGrouped = !!element.groupId;
  const canGroup = selectedCount >= 2;

  const quickRotations = [-90, -45, 45, 90];
  const scalePresets = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className="w-64 p-1.5"
        side="top"
        align="start"
        sideOffset={8}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Label */}
        <ContextMenuLabel className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
          {def?.label || element.type}
        </ContextMenuLabel>
        <div className="px-2 pb-1">
          <input
            type="text"
            value={element.label || def?.label || ""}
            onChange={(e) => {
              const ev = new CustomEvent("planner:label", { detail: { id: element.id, label: e.target.value } });
              window.dispatchEvent(ev);
            }}
            onBlur={(e) => {
              const ev = new CustomEvent("planner:label-commit", { detail: { id: element.id, label: e.target.value } });
              window.dispatchEvent(ev);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const ev = new CustomEvent("planner:label-commit", { detail: { id: element.id, label: (e.target as HTMLInputElement).value } });
                window.dispatchEvent(ev);
              }
            }}
            className="w-full h-7 text-xs rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
            placeholder={def?.label}
          />
        </div>
        <ContextMenuSeparator />

        {/* Rotation */}
        <ContextMenuLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
          Rotation
        </ContextMenuLabel>
        <div className="flex items-center gap-1 px-2 py-1">
          <button
            className="h-6 px-1.5 text-[10px] font-mono text-slate-600 rounded border border-slate-200 hover:bg-slate-50"
            onClick={() => onRotateBy(element.id, -45)}
          >
            -45°
          </button>
          <input
            type="range"
            min={0}
            max={359}
            value={rotation}
            onChange={(e) => setRotation(+e.target.value)}
            onMouseUp={() => onRotateTo(element.id, rotation)}
            onTouchEnd={() => onRotateTo(element.id, rotation)}
            className="flex-1 h-1 accent-amber-500"
          />
          <button
            className="h-6 px-1.5 text-[10px] font-mono text-slate-600 rounded border border-slate-200 hover:bg-slate-50"
            onClick={() => onRotateBy(element.id, 45)}
          >
            +45°
          </button>
          <span className="text-[9px] font-mono text-slate-500 w-7 text-center">{element.rotation}°</span>
        </div>

        <div className="grid grid-cols-4 gap-0.5 px-2 pb-1">
          {quickRotations.map((deg) => (
            <button
              key={deg}
              className="h-5 text-[9px] font-mono text-slate-500 rounded border border-slate-200 hover:bg-slate-50"
              onClick={() => onRotateBy(element.id, deg)}
            >
              {deg > 0 ? "+" : ""}{deg}°
            </button>
          ))}
        </div>

        {/* Flip */}
        <div className="flex gap-1 px-2 pb-1">
          <button
            className="flex-1 h-6 text-[10px] flex items-center justify-center gap-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => onFlip(element.id, "h")}
          >
            <FlipHorizontal className="w-3 h-3" /> Flip H
          </button>
          <button
            className="flex-1 h-6 text-[10px] flex items-center justify-center gap-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => onFlip(element.id, "v")}
          >
            <FlipVertical className="w-3 h-3" /> Flip V
          </button>
        </div>
        <ContextMenuSeparator />

        {/* Snap + Guides toggles */}
        <ContextMenuCheckboxItem
          checked={snapEnabled}
          onCheckedChange={onToggleSnap}
          className="text-xs"
        >
           <Grid3x3 className="w-3.5 h-3.5 mr-2" />
          Snap to Grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={guidesEnabled}
          onCheckedChange={onToggleGuides}
          className="text-xs"
        >
          <Ruler className="w-3.5 h-3.5 mr-2" />
          Show Alignment Guides
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />

        {/* Scale */}
        <ContextMenuLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
          Scale
        </ContextMenuLabel>
        <div className="flex gap-0.5 px-2 pb-1 flex-wrap">
          {scalePresets.map((f) => (
            <button
              key={f}
              className="h-5 px-1.5 text-[9px] font-mono text-slate-500 rounded border border-slate-200 hover:bg-slate-50"
              onClick={() => onScale(element.id, f)}
            >
              {Math.round(f * 100)}%
            </button>
          ))}
        </div>
        <ContextMenuSeparator />

        {/* Layer controls */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-2" />
            Layer Order
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={onBringToFront} className="text-xs">
              <ChevronUp className="w-3.5 h-3.5 mr-2" />
              Bring to Front
              <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onBringForward} className="text-xs">
              <ArrowUp className="w-3.5 h-3.5 mr-2" />
              Bring Forward
              <ContextMenuShortcut>[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendBackward} className="text-xs">
              <ArrowDown className="w-3.5 h-3.5 mr-2" />
              Send Backward
              <ContextMenuShortcut>]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendToBack} className="text-xs">
              <ChevronDown className="w-3.5 h-3.5 mr-2" />
              Send to Back
              <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Lock */}
        <ContextMenuItem onClick={() => onToggleLock(element.id)} className="text-xs">
          {isLocked ? <Unlock className="w-3.5 h-3.5 mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
          {isLocked ? "Unlock Element" : "Lock Element"}
          <ContextMenuShortcut>Ctrl+L</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Group / Ungroup */}
        {canGroup && (
          <ContextMenuItem onClick={onGroup} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-2" />
            Group Elements
            <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {isGrouped && (
          <ContextMenuItem onClick={onUngroup} className="text-xs">
            <Ungroup className="w-3.5 h-3.5 mr-2" />
            Ungroup
            <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />

        {/* Actions */}
        <ContextMenuItem onClick={onDuplicate} className="text-xs">
          <Copy className="w-3.5 h-3.5 mr-2" />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEditLabel(element.id)} className="text-xs">
          <Tag className="w-3.5 h-3.5 mr-2" />
          Edit Label
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
