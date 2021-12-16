import dotenv from "dotenv";
import { Credential } from "../credential";
import { Cache } from "../cache";
import { LeetCode } from "../leetcode";

describe("LeetCode", () => {
    describe("General", () => {
        it("should be an instance of LeetCode", () => {
            const lc = new LeetCode();
            expect(lc).toBeInstanceOf(LeetCode);
        });

        it("should be able to use user-specified cache", () => {
            const lc = new LeetCode(null, new Cache());
            expect(lc).toBeInstanceOf(LeetCode);
            expect(lc.cache).toBeInstanceOf(Cache);
        });
    });

    describe("Unauthenticated", () => {
        const lc = new LeetCode();

        it("should be able to get user profile", async () => {
            const user = await lc.get_user("jacoblincool");
            expect(user.matchedUser?.username.toLowerCase()).toBe("jacoblincool");
        });

        it("should be able to get user's recent submissions", async () => {
            const recent_submissions = await lc.get_recent_submissions("jacoblincool", 10);
            expect(recent_submissions.length).toBe(10);
        });

        it("should be able to use graphql", async () => {
            const { data } = await lc.graphql({
                operationName: "getQuestionsCount",
                variables: {},
                query: `
                query getQuestionsCount {
                    allQuestionsCount {
                        difficulty
                        count
                    }
                }
                `,
            });
            expect(data.allQuestionsCount.length).toBe(4);
        });

        it("should be not able to get user's submissions", async () => {
            await expect(lc.get_submissions(30, 0)).rejects.toThrow();
        });

        it("should be able to get problem information", async () => {
            const problem = await lc.get_problem("two-sum");
            expect(problem.title).toBe("Two Sum");
        });
    });

    describe("Authenticated", () => {
        jest.setTimeout(10_000);
        dotenv.config();
        const credential = new Credential();
        let lc: LeetCode;

        beforeAll(async () => {
            await credential.init(process.env["TEST_LEETCODE_SESSION"]);
            lc = new LeetCode(credential);
        });

        ifit(!!process.env["TEST_LEETCODE_SESSION"])("should be able to get user's submissions", async () => {
            const submissions = await lc.get_submissions(100, 0);
            expect(submissions.length).toBe(100);
        });

        ifit(!!process.env["TEST_LEETCODE_SESSION"])("should be not able to get user's submissions if cooldown is too short", async () => {
            await expect(lc.get_submissions(100, 0, 100)).rejects.toThrow();
        });
    });
});

function ifit(condition = true) {
    return condition ? it : it.skip;
}
