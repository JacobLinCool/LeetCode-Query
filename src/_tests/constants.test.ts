import { describe, expect, it } from "vitest";
import { BASE_URL, BASE_URL_CN, USER_AGENT } from "../constants";

describe("Contants", () => {
    it("BASE_URL", () => {
        expect(BASE_URL).toBe("https://leetcode.com");
    });

    it("BASE_URL_CN", () => {
        expect(BASE_URL_CN).toBe("https://leetcode.cn");
    });

    it("USER_AGENT", () => {
        expect(USER_AGENT).toBe("Mozilla/5.0 LeetCode API");
    });
});
