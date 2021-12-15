import { BASE_URL, USER_AGENT } from "../constants";

describe("Contants", () => {
    test("BASE_URL", () => {
        expect(BASE_URL).toBe("https://leetcode.com");
    });

    test("USER_AGENT", () => {
        expect(USER_AGENT).toBe("Mozilla/5.0 LeetCode API");
    });
});
