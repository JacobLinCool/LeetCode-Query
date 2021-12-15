import { parse_cookie, sleep } from "../utils";

describe("Utils", () => {
    test("parse_cookie", () => {
        expect(parse_cookie("a=b; c=d; abc-123=456-def")).toEqual({
            a: "b",
            c: "d",
            "abc-123": "456-def",
        });
    });

    test("sleep", async () => {
        const start = Date.now();
        const returning = await sleep(300, "I am a string");
        expect(Date.now() - start).toBeGreaterThanOrEqual(300);
        expect(returning).toBe("I am a string");
    });
});
