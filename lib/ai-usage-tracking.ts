import { prisma } from "@/lib/prisma";

interface RawUsage {
  promptTokens?: number;
  completionTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

interface UsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

interface TrackContext {
  userId?: string | null;
  model: string;
  operationType: string;
}

export function extractUsage(usage: RawUsage, providerMetadata?: unknown): UsageData {
  const promptTokens = usage.promptTokens ?? usage.inputTokens ?? 0;
  const completionTokens = usage.completionTokens ?? usage.outputTokens ?? 0;
  const totalTokens = usage.totalTokens ?? promptTokens + completionTokens;

  const meta = providerMetadata as Record<string, unknown> | undefined;
  const orMeta = meta?.openrouter as Record<string, unknown> | undefined;
  const orUsage = orMeta?.usage as Record<string, unknown> | undefined;
  const cost = typeof orUsage?.cost === "number" ? orUsage.cost : undefined;

  return { promptTokens, completionTokens, totalTokens, cost };
}

export function trackAIUsage(usage: UsageData, ctx: TrackContext): void {
  prisma.aIUsageRecord
    .create({
      data: {
        userId: ctx.userId ?? null,
        model: ctx.model,
        operationType: ctx.operationType,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        cost: usage.cost ?? null,
      },
    })
    .catch(console.error);
}
