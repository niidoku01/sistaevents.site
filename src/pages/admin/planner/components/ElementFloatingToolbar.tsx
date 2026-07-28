import React from "react";
import {
  RotateCcw, RotateCw, FlipHorizontal,
  Copy, Trash2, Tag, Lock, Unlock,
  ArrowUp, ArrowDown, Minus, Plus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlacedElement } from "../types";

interface ElementFloatingToolbarProps {
  el: PlacedElement;
  isTable: boolean;
  labelInput: { id: string; value: string } | null;
  onRotateBy: (id: string, deg: number) => void;
  onFlip: (id: string, axis: "h" | "v") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: (id: string) => void;
  onEditLabel: (id: string) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  setLabelInput: (v: { id: string; value: string } | null) => void;
  commitLabel: () => void;
  updateGuests: (id: string, delta: number) => void;
}

export default function ElementFloatingToolbar({
  el, isTable, labelInput, onRotateBy, onFlip, onDuplicate, onDelete,
  onToggleLock, onEditLabel, onBringForward, onSendBackward,
  setLabelInput, commitLabel, updateGuests,
}: ElementFloatingToolbarProps) {
  const isLocked = el.locked ?? false;
  const isEditingLabel = labelInput?.id === el.id;
  const seatCount = el.guests ?? (el.type === "round-table" ? 10 : 8);

  return (
    <div
      className="absolute pointer-events-auto z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        bottom: "100%",
        left: "50%",
        transform: `translateX(-50%) rotate(${-el.rotation}deg)`,
        marginBottom: 4,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Label editor */}
      {isEditingLabel && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 px-3 py-2 whitespace-nowrap">
          <span className="text-[10px] font-medium text-slate-500">Label:</span>
          <Input
            autoFocus
            value={labelInput.value}
            onChange={(e) => setLabelInput({ ...labelInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLabel();
              if (e.key === "Escape") setLabelInput(null);
            }}
            onBlur={commitLabel}
            className="h-7 text-xs w-36 rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
          />
        </div>
      )}

      {/* Main toolbar */}
      <div className="flex items-center gap-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/60 px-1.5 py-1">
        {/* Rotate */}
        <ToolBtn onClick={() => onRotateBy(el.id, -90)} title="Rotate left 90°">
          <RotateCcw className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => onRotateBy(el.id, 90)} title="Rotate right 90°">
          <RotateCw className="w-3.5 h-3.5" />
        </ToolBtn>

        <Separator />

        {/* Flip */}
        <ToolBtn onClick={() => onFlip(el.id, "h")} title="Flip horizontal">
          <FlipHorizontal className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Seats (tables only) */}
        {isTable && (
          <>
            <Separator />
            <ToolBtn onClick={() => updateGuests(el.id, -1)} disabled={seatCount <= 8} title="Fewer seats">
              <Minus className="w-3 h-3" />
            </ToolBtn>
            <div className="flex items-center gap-0.5 px-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-mono font-bold text-slate-700 w-4 text-center">{seatCount}</span>
            </div>
            <ToolBtn onClick={() => updateGuests(el.id, 1)} disabled={seatCount >= 12} title="More seats">
              <Plus className="w-3 h-3" />
            </ToolBtn>
          </>
        )}

        <Separator />

        {/* Layer */}
        <ToolBtn onClick={onSendBackward} title="Send backward">
          <ArrowDown className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={onBringForward} title="Bring forward">
          <ArrowUp className="w-3.5 h-3.5" />
        </ToolBtn>

        <Separator />

        {/* Actions */}
        <ToolBtn onClick={onDuplicate} title="Duplicate">
          <Copy className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => onEditLabel(el.id)} title="Edit label">
          <Tag className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => onToggleLock(el.id)} title={isLocked ? "Unlock" : "Lock"}>
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </ToolBtn>

        <Separator />

        {/* Delete */}
        <ToolBtn onClick={onDelete} title="Delete" variant="danger">
          <Trash2 className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, disabled, title, children, variant }: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <Button
      variant="ghost" size="sm"
      className={`h-9 w-9 sm:h-7 sm:w-7 p-0 rounded-xl transition-all duration-150
        ${variant === "danger"
          ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-90"
        }
        disabled:opacity-30 disabled:pointer-events-none`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

function Separator() {
  return <div className="w-px h-4 bg-slate-200/60 mx-0.5" />;
}
