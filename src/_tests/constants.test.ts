import { BASE_URL, BASE_URL_CN, USER_AGENT } from "../constants";

describe("Contants", () => {
    test("BASE_URL", () => {
        expect(BASE_URL).toBe("https://leetcode.com");
    });

    test("BASE_URL_CN", () => {
        expect(BASE_URL_CN).toBe("https://leetcode.cn");
    });

    test("USER_AGENT", () => {
        expect(USER_AGENT).toBe("Mozilla/5.0 LeetCode API");
    });
});
