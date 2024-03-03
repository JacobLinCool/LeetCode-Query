import { describe, expect, it } from "vitest";
import { Mutex, RateLimiter } from "../mutex";
import { sleep } from "../utils";

describe("Mutex", () => {
    it("should be an instance of Mutex", () => {
        const mutex = new Mutex();
        expect(mutex).toBeInstanceOf(Mutex);
    });

    it("should be able to lock and unlock", async () => {
        const mutex = new Mutex();

        const results: number[] = [];
        for (let i = 0; i < 10; i++) {
            (async () => {
                await mutex.lock();
                await sleep(100);
                results.push(i);
                mutex.unlock();
            })();
        }

        expect(results).toEqual([]);
        await sleep(1050);
        expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});

describe("RateLimiter", () => {
    it("should be an instance of RateLimiter", () => {
        const rate_limiter = new RateLimiter();
        expect(rate_limiter).toBeInstanceOf(RateLimiter);
    });

    it("should be able to limit", async () => {
        const limiter = new RateLimiter();
        limiter.limit = 4;
        limiter.interval = 500;

        const results: number[] = [];
        for (let i = 0; i < 10; i++) {
            (async () => {
                await limiter.lock();
                results.push(i);
                await sleep(50);
                limiter.unlock();
            })();
        }

        expect(results).toEqual([]);
        await sleep(900);
        expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        await sleep(1000);
        expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});
