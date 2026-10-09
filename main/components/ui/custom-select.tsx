"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  badgeClassName?: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Pilih...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate absolute coordinates in viewport
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(options.length * 38 + 16, 240);
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const dropdownWidth = Math.max(rect.width, 160);
    const maxLeft = Math.max(8, window.innerWidth - dropdownWidth - 8);
    const clampedLeft = Math.min(Math.max(8, rect.left), maxLeft);

    setCoords({
      top: placeAbove ? rect.top - 4 : rect.bottom + 4,
      left: clampedLeft,
      width: Math.min(dropdownWidth, window.innerWidth - 16),
      placeAbove,
    });
  };

  useEffect(() => {
    if (open) {
      updatePosition();

      function handleScrollOrResize() {
        updatePosition();
      }

      function handlePointerDown(e: MouseEvent) {
        if (
          buttonRef.current &&
          !buttonRef.current.contains(e.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      }

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
          setOpen(false);
        }
      }

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, options.length]);

  return (
    <div className={`relative inline-block w-full text-xs ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          updatePosition();
          setOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all outline-hidden cursor-pointer ${
          open
            ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-white dark:bg-zinc-800"
            : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
        } ${triggerClassName}`}
      >
        <span className="truncate flex items-center gap-1.5 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className={`shrink-0 text-[10px] px-1.5 py-0.2 rounded font-semibold ${selectedOption.badgeClassName || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}>
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Render menu into Portal at document body to avoid any table overflow/clipping */}
      {mounted && open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            minWidth: `${coords.width}px`,
            maxWidth: "320px",
            zIndex: 99999,
          }}
          className={`max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-center text-zinc-400 text-[11px]">
              Tidak ada pilihan
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${opt.badgeClassName || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
