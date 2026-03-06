"use client";

import { Card } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { ChipStack } from "./ChipStack";

interface CommunityCardsProps {
  cards: Card[];
  pot: number;
}

export function CommunityCards({ cards, pot }: CommunityCardsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Community cards */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="relative">
            {cards[i] ? (
              <PlayingCard card={cards[i]} faceDown={false} size="md" />
            ) : (
              <div
                className="w-12 h-16 rounded-[4px] border border-white/5"
                style={{ background: "rgba(0,0,0,0.2)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pot with chip stack */}
      {pot > 0 && (
        <div className="flex items-end gap-2">
          <ChipStack amount={pot} size="md" />
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-1"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <span className="text-yellow-400 font-black text-sm font-mono">
              POT ${pot.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
