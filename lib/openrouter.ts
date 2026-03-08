import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": "https://poker-tot.vercel.app",
    "X-Title": "Poker Training App",
  },
});

export const AI_MODELS_POOL = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-3-flash-preview",
  "openai/gpt-4o-mini",
  "openai/gpt-4.1-mini",
  "x-ai/grok-3-mini",
  "deepseek/deepseek-v3.2",
  "minimax/minimax-m2.5",
  "moonshotai/kimi-k2.5",
];

export const PERSONALITY_PROMPTS: Record<string, string> = {
  TAG: "You play tight and aggressive. You only enter pots with strong hands (pairs, high cards, suited connectors). When you have a strong hand you bet and raise confidently. You rarely bluff.",
  LAG: "You play loose and aggressive. You enter many pots, frequently raise with medium hands, and apply relentless pressure. You bluff occasionally to keep opponents guessing.",
  nit: "You are extremely tight. You fold almost everything unless you have premium hands (AA, KK, QQ, JJ, AK). You never bluff and you rarely raise unless you have the nuts.",
  fish: "You are a calling station. You call too often, chase draws even with bad pot odds, and rarely raise even with strong hands. You are passive and optimistic.",
  maniac: "You are a wild, unpredictable player. You raise and re-raise with almost any two cards. You bluff constantly, go all-in frequently, and put maximum pressure on opponents.",
};
