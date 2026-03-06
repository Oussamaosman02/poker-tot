import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": "https://poker-tot.vercel.app",
    "X-Title": "Poker Training App",
  },
});

export const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "qwen/qwen3-8b:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

export const PERSONALITY_PROMPTS: Record<string, string> = {
  TAG: "You play tight and aggressive. You only enter pots with strong hands (pairs, high cards, suited connectors). When you have a strong hand you bet and raise confidently. You rarely bluff.",
  LAG: "You play loose and aggressive. You enter many pots, frequently raise with medium hands, and apply relentless pressure. You bluff occasionally to keep opponents guessing.",
  nit: "You are extremely tight. You fold almost everything unless you have premium hands (AA, KK, QQ, JJ, AK). You never bluff and you rarely raise unless you have the nuts.",
  fish: "You are a calling station. You call too often, chase draws even with bad pot odds, and rarely raise even with strong hands. You are passive and optimistic.",
  maniac: "You are a wild, unpredictable player. You raise and re-raise with almost any two cards. You bluff constantly, go all-in frequently, and put maximum pressure on opponents.",
};
