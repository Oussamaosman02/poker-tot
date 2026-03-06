"use client";

import { Card, Suit } from "@/lib/poker/types";
import { displayRank } from "@/lib/poker/deck";
import { cn } from "@/lib/utils";

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-gray-900",
  spades: "text-gray-900",
};

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  highlight?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-8 h-11 text-xs",
  md: "w-12 h-16 text-sm",
  lg: "w-16 h-22 text-base",
};

export function PlayingCard({ card, faceDown = false, size = "sm", className, highlight }: PlayingCardProps) {
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "rounded-[4px] border border-white/10 flex items-center justify-center relative overflow-hidden",
          SIZE_CLASSES[size],
          className
        )}
        style={{
          background: "linear-gradient(135deg, #1a2744 0%, #0f1a33 50%, #1a2744 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Card back pattern */}
        <div className="absolute inset-1 rounded-sm opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 6px)",
          }}
        />
        <div className="w-3 h-3 rounded-full border border-yellow-500/30 z-10" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[4px] bg-white border flex flex-col items-start justify-between p-0.5 relative select-none",
        SIZE_CLASSES[size],
        highlight && "ring-2 ring-yellow-400",
        className
      )}
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      <div className={cn("font-black leading-none", SUIT_COLORS[card.suit])}>
        <div className="text-[10px] font-extrabold leading-none">{displayRank(card.rank)}</div>
        <div className="text-[8px] leading-none">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      {/* Center suit */}
      <div className={cn("text-base absolute inset-0 flex items-center justify-center opacity-30 font-bold", SUIT_COLORS[card.suit])}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div className={cn("font-black leading-none self-end rotate-180", SUIT_COLORS[card.suit])}>
        <div className="text-[10px] font-extrabold leading-none">{displayRank(card.rank)}</div>
        <div className="text-[8px] leading-none">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  );
}
