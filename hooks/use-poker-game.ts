"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GameState, GameMode, PlayerAction, Player, Card,
} from "@/lib/poker/types";
import {
  createInitialState, startHand, applyAction, getAvailableActions,
  totalPot, getPositionLabel,
} from "@/lib/poker/game-engine";
import { calculateOdds, preflopHandStrength } from "@/lib/poker/odds-calculator";
import { evaluateBestHand } from "@/lib/poker/hand-evaluator";
import { cardToString } from "@/lib/poker/deck";

interface HandRecord {
  handNumber: number;
  holeCards: string[];
  communityCards: string[];
  position: string;
  actions: { street: string; action: string; amount: number }[];
  result: "won" | "lost" | "folded";
  profitLoss: number;
  potSize: number;
  handStrength: string | null;
  advisorAction: string | null;
  playerAction: string;
  followedAdvisor: boolean;
  vpip: boolean;
  pfr: boolean;
}

export function usePokerGame(mode: GameMode, sessionId: string | null, enableAdvisor = false) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(mode));
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [advisorHint, setAdvisorHint] = useState<string | null>(null);
  const [trainingFeedback, setTrainingFeedback] = useState<string | null>(null);
  const [handStartStack, setHandStartStack] = useState(10000);

  // Track hand actions for stats
  const currentHandActions = useRef<{ street: string; action: string; amount: number }[]>([]);
  const humanPreFlopRaised = useRef(false);
  const humanVPIP = useRef(false);
  const advisorActionRef = useRef<string | null>(null);
  const humanActionRef = useRef<string | null>(null);

  // ── Compute odds after each state update ────────────────────────────────
  const updateOdds = useCallback((state: GameState) => {
    if (state.phase === "idle" || state.phase === "showdown") return state;
    const odds = calculateOdds(state.players, state.communityCards, 300);
    const players = state.players.map(p => ({
      ...p,
      winProbability: odds[p.id] ?? p.winProbability,
      handDescription: p.holeCards.length >= 2 && state.communityCards.length > 0
        ? evaluateBestHand(p.holeCards, state.communityCards).description
        : p.handDescription,
    }));
    return { ...state, players };
  }, []);

  // ── Advisor hint ────────────────────────────────────────────────────────
  const computeAdvisorHint = useCallback((state: GameState) => {
    const humanIdx = state.players.findIndex(p => p.isHuman);
    if (humanIdx === -1) return;
    const human = state.players[humanIdx];
    if (human.holeCards.length < 2) return;

    const actions = getAvailableActions(state, humanIdx);
    let strength = 0;

    if (state.communityCards.length === 0) {
      strength = preflopHandStrength(human.holeCards);
    } else {
      const result = evaluateBestHand(human.holeCards, state.communityCards);
      strength = Math.min(result.score / 8e10, 1);
    }

    const potOdds = actions.callAmount > 0 ? actions.callAmount / (totalPot(state) + actions.callAmount) : 0;

    let hint = "";
    if (strength > 0.75) {
      hint = actions.canRaise
        ? `Strong hand — consider raising to $${Math.min(actions.minRaise * 2, actions.maxRaise).toLocaleString()}`
        : "Strong hand — call";
    } else if (strength > 0.5) {
      hint = potOdds < 0.25
        ? "Decent hand, pot odds are good — call"
        : "Marginal hand — consider calling or folding";
    } else if (strength > 0.3 && potOdds < 0.15) {
      hint = "Weak hand but good pot odds — call or fold";
    } else {
      hint = actions.canCheck ? "Weak hand — check" : "Weak hand — fold";
    }

    advisorActionRef.current = hint;
    setAdvisorHint(hint);
  }, []);

  // ── AI Turn ─────────────────────────────────────────────────────────────
  const runAITurn = useCallback(async (state: GameState) => {
    const playerIdx = state.currentPlayerIndex;
    const player = state.players[playerIdx];
    if (!player || player.isHuman || player.isFolded || player.isAllIn || player.isEliminated) return;

    setIsAIThinking(true);

    // Minimum delay for realism (0.8–2.5s)
    const delay = 800 + Math.random() * 1700;
    await new Promise(r => setTimeout(r, delay));

    const actions = getAvailableActions(state, playerIdx);
    const availableActions: PlayerAction[] = [];
    if (actions.canFold) availableActions.push("fold");
    if (actions.canCheck) availableActions.push("check");
    if (actions.canCall) availableActions.push("call");
    if (actions.canRaise) availableActions.push("raise");
    if (actions.canAllIn) availableActions.push("all-in");

    const opponents = state.players
      .filter(p => !p.isFolded && !p.isEliminated && p.id !== player.id)
      .map(p => `${p.name} ($${p.stack})`)
      .join(", ");

    let action: PlayerAction = "fold";
    let amount: number | undefined;

    try {
      const res = await fetch("/api/ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: player.aiModel ?? "google/gemini-2.5-flash",
          personality: player.personality ?? "TAG",
          playerName: player.name,
          holeCards: player.holeCards.map(cardToString).join(" "),
          communityCards: state.communityCards.map(cardToString).join(" "),
          position: getPositionLabel(state, playerIdx),
          stack: player.stack,
          pot: totalPot(state),
          callAmount: actions.callAmount,
          currentBet: player.streetBet,
          minRaise: actions.minRaise,
          maxRaise: actions.maxRaise,
          availableActions,
          opponents,
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json();
      action = data.action ?? (actions.canCheck ? "check" : "fold");
      amount = data.amount;
    } catch {
      // Fallback rule-based
      action = actions.canCheck ? "check" : actions.canCall && Math.random() > 0.3 ? "call" : "fold";
    }

    setIsAIThinking(false);
    setGameState(prev => {
      const next = applyAction(prev, playerIdx, action, amount);
      return updateOdds(next);
    });
  }, [updateOdds]);

  // ── Watch for AI turns ───────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.isWaitingForAI && gameState.phase !== "idle" && gameState.phase !== "showdown") {
      runAITurn(gameState);
    }
  }, [gameState.isWaitingForAI, gameState.currentPlayerIndex, gameState.phase]);

  // ── Compute advisor hint when human turn ────────────────────────────────
  useEffect(() => {
    const humanIdx = gameState.players.findIndex(p => p.isHuman);
    if (humanIdx !== -1 && gameState.players[humanIdx].isActive && (mode === "advisor" || mode === "training" || enableAdvisor)) {
      computeAdvisorHint(gameState);
    } else {
      setAdvisorHint(null);
    }
  }, [gameState.currentPlayerIndex, gameState.phase, mode, enableAdvisor]);

  // ── Human Action ────────────────────────────────────────────────────────
  const humanAction = useCallback((action: PlayerAction, amount?: number) => {
    const humanIdx = gameState.players.findIndex(p => p.isHuman);
    if (humanIdx === -1) return;

    // Track VPIP / PFR
    if (gameState.phase === "preflop") {
      if (action === "call" || action === "raise" || action === "all-in") {
        humanVPIP.current = true;
      }
      if (action === "raise" || action === "all-in") {
        humanPreFlopRaised.current = true;
      }
    }

    const street = gameState.phase;
    currentHandActions.current.push({ street, action, amount: amount ?? 0 });
    humanActionRef.current = action;

    // Training mode feedback
    if ((mode === "training" || enableAdvisor) && advisorHint) {
      const advisorSuggested = advisorHint.toLowerCase().includes(action) ? action : null;
      const followed = advisorSuggested === action;
      if (!followed) {
        setTrainingFeedback(`Advisor suggested: ${advisorHint}`);
        setTimeout(() => setTrainingFeedback(null), 4000);
      } else {
        setTrainingFeedback("Good decision!");
        setTimeout(() => setTrainingFeedback(null), 2000);
      }
    }

    setGameState(prev => {
      const next = applyAction(prev, humanIdx, action, amount);
      return updateOdds(next);
    });
  }, [gameState, mode, advisorHint, updateOdds]);

  // ── Start New Hand ───────────────────────────────────────────────────────
  const newHand = useCallback(() => {
    currentHandActions.current = [];
    humanPreFlopRaised.current = false;
    humanVPIP.current = false;
    advisorActionRef.current = null;
    humanActionRef.current = null;
    setTrainingFeedback(null);
    setAdvisorHint(null);

    setGameState(prev => {
      const humanStack = prev.players.find(p => p.isHuman)?.stack ?? 10000;
      setHandStartStack(humanStack);
      const next = startHand(prev);
      return updateOdds(next);
    });
  }, [updateOdds]);

  // ── Save hand to DB ─────────────────────────────────────────────────────
  const saveHand = useCallback(async (state: GameState) => {
    if (!sessionId) return;
    const human = state.players.find(p => p.isHuman);
    if (!human) return;

    const winner = state.winners.find(w => w.playerId === human.id);
    const result = human.isFolded ? "folded" : winner ? "won" : "lost";
    const pot = winner ? winner.amount : 0;
    const profitLoss = winner ? winner.amount - handStartStack + human.stack : human.stack - handStartStack;

    const humanIdx = state.players.findIndex(p => p.isHuman);
    const position = getPositionLabel(state, humanIdx);
    const handStrength = human.holeCards.length >= 2
      ? evaluateBestHand(human.holeCards, state.communityCards).description
      : null;

    try {
      await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          hand: {
            handNumber: state.handNumber,
            holeCards: human.holeCards.map(cardToString),
            communityCards: state.communityCards.map(cardToString),
            position,
            actions: currentHandActions.current,
            result,
            profitLoss,
            potSize: totalPot(state) + state.mainPot,
            handStrength,
            advisorAction: advisorActionRef.current,
            playerAction: humanActionRef.current ?? "none",
            followedAdvisor: advisorActionRef.current
              ? advisorActionRef.current.toLowerCase().includes(humanActionRef.current ?? "")
              : false,
            vpip: humanVPIP.current,
            pfr: humanPreFlopRaised.current,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to save hand", e);
    }
  }, [sessionId, handStartStack]);

  // Auto-save when showdown
  useEffect(() => {
    if (gameState.phase === "showdown" && sessionId) {
      saveHand(gameState);
    }
  }, [gameState.phase]);

  const availableActions = (() => {
    const humanIdx = gameState.players.findIndex(p => p.isHuman);
    if (humanIdx === -1 || !gameState.players[humanIdx].isActive) return null;
    return getAvailableActions(gameState, humanIdx);
  })();

  return {
    gameState,
    isAIThinking,
    advisorHint,
    trainingFeedback,
    availableActions,
    humanAction,
    newHand,
    totalPot: totalPot(gameState),
  };
}
