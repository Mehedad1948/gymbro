import { PlanSchema, type Plan } from "./schema";

export type ParseResult = { ok: true; plan: Plan } | { ok: false; errors: string[] };

/** Parse unknown JSON (string or object) into a validated Plan. */
export function parsePlan(input: unknown): ParseResult {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] };
    }
  }
  const res = PlanSchema.safeParse(data);
  if (res.success) return { ok: true, plan: res.data };
  return {
    ok: false,
    errors: res.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}
