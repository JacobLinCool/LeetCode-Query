import { describe, expect, it } from "vitest";
import { Cache, cache, caches } from "../cache";
import { sleep } from "../utils";

describe("Cache", () => {
    describe("default cache", () => {
        it("should be a Cache", () => {
            expect(cache).toBeInstanceOf(Cache);
        });

        it("should be able to get and set", () => {
            cache.set("test", "test");
            expect(cache.get("test")).toBe("test");
            cache.clear();
        });

        it("should expire after 300ms", async () => {
            cache.set("test", "test", 300);
            await sleep(300);
            expect(cache.get("test")).toBeNull();
            cache.clear();
        });

        it("should expire immediately", async () => {
            cache.set("test", "test", 0);
            expect(cache.get("test")).toBeNull();
            cache.clear();
        });

        it("should be able to remove", () => {
            cache.set("test", "test");
            cache.remove("test");
            expect(cache.get("test")).toBeNull();
            cache.clear();
        });

        it("should be able to clear", () => {
            cache.set("test", "test");
            cache.clear();
            expect(cache.get("test")).toBeNull();
            cache.clear();
        });

        it("should be able to load", () => {
            cache.set("test", "test");
            cache.load(
                JSON.stringify({
                    test: { key: "test", value: "test", expires: Date.now() + 1000 },
                }),
            );
            expect(cache.get("test")).toBe("test");
            cache.clear();
        });
    });

    describe("named caches", () => {
        it("should be a Cache", () => {
            expect(caches.default).toBeInstanceOf(Cache);
        });

        it("should be able to get and set", () => {
            caches.default.set("test", "test");
            expect(caches.default.get("test")).toBe("test");
            caches.default.clear();
        });

        it("should expire after 300ms", async () => {
            caches.default.set("test", "test", 300);
            await sleep(300);
            expect(caches.default.get("test")).toBeNull();
            caches.default.clear();
        });

        it("should be able to remove", () => {
            caches.default.set("test", "test");
            caches.default.remove("test");
            expect(caches.default.get("test")).toBeNull();
            caches.default.clear();
        });

        it("should be able to clear", () => {
            caches.default.set("test", "test");
            caches.default.clear();
            expect(caches.default.get("test")).toBeNull();
            caches.default.clear();
        });

        it("should be able to load", () => {
            caches.default.set("test", "test");
            caches.default.load(
                JSON.stringify({
                    test: { key: "test", value: "test", expires: Date.now() + 1000 },
                }),
            );
            expect(caches.default.get("test")).toBe("test");
            caches.default.clear();
        });
    });

    describe("new cache", () => {
        const c = new Cache();

        it("should be a Cache", () => {
            expect(c).toBeInstanceOf(Cache);
        });

        it("should be able to get and set", () => {
            c.set("test", "test");
            expect(c.get("test")).toBe("test");
            c.clear();
        });

        it("should expire after 300ms", async () => {
            c.set("test", "test", 300);
            await sleep(350);
            expect(c.get("test")).toBeNull();
            c.clear();
        });

        it("should be able to remove", () => {
            c.set("test", "test");
            c.remove("test");
            expect(c.get("test")).toBeNull();
            c.clear();
        });

        it("should be able to clear", () => {
            c.set("test", "test");
            c.clear();
            expect(c.get("test")).toBeNull();
            c.clear();
        });

        it("should be able to load", () => {
            c.set("test", "test");
            c.load(
                JSON.stringify({
                    test: { key: "test", value: "test", expires: Date.now() + 1000 },
                }),
            );
            expect(c.get("test")).toBe("test");
            c.clear();
        });
    });
});
