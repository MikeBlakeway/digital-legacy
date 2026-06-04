import assert from "node:assert/strict";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  deleteMemory,
  listMemories,
  updateMemoryVisibility,
  type Memory,
} from "@/lib/supabase/memories";

type QueryCall =
  | { method: "from"; table: string }
  | { method: "select"; columns: string; options?: { count?: "exact" } }
  | { method: "eq"; column: string; value: string | boolean }
  | { method: "ilike"; column: string; pattern: string }
  | { method: "order"; column: string; ascending: boolean }
  | { method: "range"; from: number; to: number }
  | { method: "update"; values: Record<string, unknown> }
  | { method: "delete" }
  | { method: "single" }
  | { method: "maybeSingle" };

type QueryResult = {
  data: unknown;
  error: unknown;
  count: number | null;
};

const memoryRow: Memory = {
  id: "11111111-1111-1111-1111-111111111111",
  persona_id: "22222222-2222-2222-2222-222222222222",
  content: "A long memory about family at the beach.",
  source: "diary",
  question_prompt: null,
  media_asset_id: null,
  visibility: "family",
  created_at: "2026-01-02T10:00:00.000Z",
};

const personaId = "22222222-2222-2222-2222-222222222222";
const memoryId = "11111111-1111-1111-1111-111111111111";

async function run() {
  const listClient = createMemoryClient({
    data: [memoryRow],
    count: 12,
  });
  const listResult = await listMemories(listClient.client, {
    personaId,
    q: " family ",
    source: "diary",
    page: 2,
    perPage: 100,
  });

  assert.equal(listResult.total, 12);
  assert.equal(listResult.page, 2);
  assert.equal(listResult.per_page, 50);
  assert.deepEqual(listResult.memories, [memoryRow]);
  assert.deepEqual(listClient.calls, [
    { method: "from", table: "memories" },
    {
      method: "select",
      columns:
        "id, persona_id, content, source, question_prompt, media_asset_id, visibility, created_at",
      options: { count: "exact" },
    },
    { method: "eq", column: "persona_id", value: personaId },
    { method: "ilike", column: "content", pattern: "%family%" },
    { method: "eq", column: "source", value: "diary" },
    { method: "order", column: "created_at", ascending: false },
    { method: "range", from: 50, to: 99 },
  ]);

  const updateClient = createMemoryClient({
    data: { ...memoryRow, visibility: "private" },
    count: null,
  });
  const updated = await updateMemoryVisibility(updateClient.client, {
    personaId,
    memoryId,
    visibility: "private",
  });

  assert.equal(updated.visibility, "private");
  assert.deepEqual(updateClient.calls, [
    { method: "from", table: "memories" },
    { method: "update", values: { visibility: "private" } },
    { method: "eq", column: "persona_id", value: personaId },
    { method: "eq", column: "id", value: memoryId },
    {
      method: "select",
      columns:
        "id, persona_id, content, source, question_prompt, media_asset_id, visibility, created_at",
    },
    { method: "single" },
  ]);

  const deleteClient = createMemoryClient({
    data: { id: memoryId },
    count: null,
  });
  const wasDeleted = await deleteMemory(deleteClient.client, {
    personaId,
    memoryId,
  });

  assert.equal(wasDeleted, true);
  assert.deepEqual(deleteClient.calls, [
    { method: "from", table: "memories" },
    { method: "delete" },
    { method: "eq", column: "persona_id", value: personaId },
    { method: "eq", column: "id", value: memoryId },
    { method: "select", columns: "id" },
    { method: "maybeSingle" },
  ]);
}

function createMemoryClient(
  result: Omit<QueryResult, "error"> & { error?: unknown },
): {
  client: SupabaseClient;
  calls: QueryCall[];
} {
  const calls: QueryCall[] = [];
  const queryResult: QueryResult = {
    ...result,
    error: result.error ?? null,
  };

  return {
    calls,
    client: {
      from(table: string) {
        calls.push({ method: "from", table });
        return new MemoryQueryBuilder(calls, queryResult);
      },
    } as unknown as SupabaseClient,
  };
}

class MemoryQueryBuilder implements PromiseLike<QueryResult> {
  constructor(
    private readonly calls: QueryCall[],
    private readonly result: QueryResult,
  ) {}

  select(columns: string, options?: { count?: "exact" }): this {
    this.calls.push({ method: "select", columns, ...(options ? { options } : {}) });
    return this;
  }

  eq(column: string, value: string | boolean): this {
    this.calls.push({ method: "eq", column, value });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.calls.push({ method: "ilike", column, pattern });
    return this;
  }

  order(column: string, options: { ascending: boolean }): this {
    this.calls.push({ method: "order", column, ascending: options.ascending });
    return this;
  }

  range(from: number, to: number): this {
    this.calls.push({ method: "range", from, to });
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.calls.push({ method: "update", values });
    return this;
  }

  delete(): this {
    this.calls.push({ method: "delete" });
    return this;
  }

  single(): Promise<QueryResult> {
    this.calls.push({ method: "single" });
    return Promise.resolve(this.result);
  }

  maybeSingle(): Promise<QueryResult> {
    this.calls.push({ method: "maybeSingle" });
    return Promise.resolve(this.result);
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
