"use client";

import { cn } from "@/lib/utils";

// Chip tiers: value → [bg, border, label-color]
const CHIP_TIERS: [number, string, string, string][] = [
  [1000, "#d97706", "#92400e", "#fff8e1"],   // gold   $1000+
  [500,  "#7c3aed", "#4c1d95", "#ede9fe"],   // purple $500
  [100,  "#374151", "#111827", "#d1d5db"],   // black  $100
  [25,   "#16a34a", "#14532d", "#bbf7d0"],   // green  $25
  [5,    "#dc2626", "#991b1b", "#fecaca"],   // red    $5
  [1,    "#d1d5db", "#9ca3af", "#374151"],   // white  $1
];

function getChipColor(denomination: number) {
  for (const [min, bg, border, text] of CHIP_TIERS) {
    if (denomination >= min) return { bg, border, text };
  }
  return { bg: "#d1d5db", border: "#9ca3af", text: "#374151" };
}

function buildStack(amount: number): { color: ReturnType<typeof getChipColor>; count: number }[] {
  if (amount <= 0) return [];
  const chips: { color: ReturnType<typeof getChipColor>; count: number }[] = [];
  let remaining = amount;
  for (const [denom] of CHIP_TIERS) {
    const n = Math.floor(remaining / denom);
    if (n > 0) {
      chips.push({ color: getChipColor(denom), count: Math.min(n, 5) });
      remaining -= n * denom;
    }
    if (remaining <= 0) break;
  }
  return chips;
}

interface ChipStackProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
  label?: boolean;
}

const SIZE = {
  sm: { d: 16, gap: 5 },
  md: { d: 20, gap: 6 },
  lg: { d: 26, gap: 8 },
};

export function ChipStack({ amount, size = "sm", animated, className, label = false }: ChipStackProps) {
  if (amount <= 0) return null;

  const s = SIZE[size];
  const tiers = buildStack(amount);
  // Flatten into individual chip entries (max ~10 total visible)
  const allChips: ReturnType<typeof getChipColor>[] = [];
  for (const tier of tiers) {
    for (let i = 0; i < tier.count; i++) allChips.push(tier.color);
    if (allChips.length >= 10) break;
  }

  return (
    <div className={cn("flex flex-col items-center gap-0", animated && "animate-chip-pop", className)}>
      {/* Stack: circles from bottom to top, each slightly offset upward */}
      <div
        className="relative"
        style={{ width: s.d, height: s.d + (allChips.length - 1) * s.gap }}
      >
        {allChips.map((chip, i) => (
          <div
            key={i}
            className="absolute left-0"
            style={{
              width: s.d,
              height: s.d,
              borderRadius: "50%",
              bottom: i * s.gap,
              background: `radial-gradient(circle at 38% 35%, ${chip.bg}ff, ${chip.bg}cc)`,
              border: `2px solid ${chip.border}`,
              boxShadow: `0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          />
        ))}
      </div>
      {/* Optional label */}
      {label && (
        <span className="text-[9px] font-bold text-yellow-400 mt-0.5 font-mono">
          ${amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
        </span>
      )}
    </div>
  );
}

/** Mini chip dots row — for showing a player's total stack compactly */
export function StackDots({ amount, max = 10000 }: { amount: number; max?: number }) {
  const pct = Math.min(amount / max, 1);
  const filled = Math.round(pct * 8);
  return (
    <div className="flex gap-[2px] items-center">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: i < filled
              ? i < 3 ? "#dc2626" : i < 6 ? "#16a34a" : "#d97706"
              : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}
