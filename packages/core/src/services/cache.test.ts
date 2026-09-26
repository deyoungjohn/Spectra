// packages/core/src/services/cache.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryCacheService } from "./cache.js";

describe("MemoryCacheService", () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
  });

  it("stores and retrieves a value", async () => {
    await cache.set("key1", { test: "data" }, 10);
    const value = await cache.get<{ test: string }>("key1");
    expect(value).toEqual({ test: "data" });
  });

  it("returns null for non-existent key", async () => {
    const value = await cache.get("non-existent");
    expect(value).toBeNull();
  });

  it("has() returns true for present key and false for missing", async () => {
    await cache.set("exists", 123, 10);
    expect(await cache.has("exists")).toBe(true);
    expect(await cache.has("nope")).toBe(false);
  });

  it("del() removes a key", async () => {
    await cache.set("toDelete", "abc", 10);
    await cache.del("toDelete");
    expect(await cache.get("toDelete")).toBeNull();
    expect(await cache.has("toDelete")).toBe(false);
  });

  it("expires entries after TTL", async () => {
    // Set 0 second TTL (expires immediately in next tick)
    await cache.set("quickExpire", "val", -1);
    const value = await cache.get("quickExpire");
    expect(value).toBeNull();
  });

  it("prune() deletes expired keys", async () => {
    await cache.set("exp1", "val1", -1);
    await cache.set("exp2", "val2", -1);
    await cache.set("alive", "val3", 60);

    const pruned = cache.prune();
    expect(pruned).toBe(2);
    expect(cache.size()).toBe(1);
    expect(await cache.get("alive")).toBe("val3");
  });

  it("clear() clears all keys", async () => {
    await cache.set("k1", 1, 60);
    await cache.set("k2", 2, 60);
    await cache.clear();
    expect(cache.size()).toBe(0);
  });
});
