import dotenv from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";
import { Cache } from "../cache";
import { Credential } from "../credential";
import { LeetCode } from "../leetcode";

describe("LeetCode", { timeout: 15_000 }, () => {
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
        lc.limiter.limit = 100;
        lc.limiter.interval = 3;
        lc.on("receive-graphql", async (res) => {
            await res.clone().json();
        });

        it("should be able to get a user's profile", async () => {
            const user = await lc.user("jacoblincool");
            expect(user.matchedUser?.username.toLowerCase()).toBe("jacoblincool");
        });

        it("should be able to get a user's recent submissions", async () => {
            const recent_submissions = await lc.recent_submissions("jacoblincool", 10);
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

        it("should be not able to get own submissions", async () => {
            await expect(lc.submissions({ limit: 30, offset: 0 })).rejects.toThrow();
        });

        it("should be able to get own information", async () => {
            const user = await lc.whoami();
            expect(user.userId).toBe(null);
            expect(user.username).toBe("");
            expect(user.isSignedIn).toBe(false);
        });

        it("should be able to get a user's contest informations", async () => {
            const contests = await lc.user_contest_info("lapor");
            expect(contests.userContestRanking.rating).toBeGreaterThan(1500);
            expect(contests.userContestRankingHistory.length).toBeGreaterThan(0);
        });

        it("should be able to get problem information", async () => {
            const problem = await lc.problem("two-sum");
            expect(problem.title).toBe("Two Sum");
        });

        it("should be able to get problems", async () => {
            const problems = await lc.problems({ filters: { difficulty: "EASY" } });
            expect(problems.total).toBeGreaterThan(500);
            expect(problems.questions.length).toBe(100);
        });

        it("should be able to get daily challenge", async () => {
            const daily = await lc.daily();
            expect(Date.now() - new Date(daily.date).getTime()).toBeLessThan(
                24 * 60 * 60 * 1000 + 1000,
            );
        });
    });

    describe("Authenticated", () => {
        dotenv.config();
        const credential = new Credential();
        let lc: LeetCode;

        beforeAll(async () => {
            await credential.init(process.env["TEST_LEETCODE_SESSION"]);
            lc = new LeetCode(credential);
        });

        it.skipIf(!process.env["TEST_LEETCODE_SESSION"])(
            "should be able to get own submissions",
            async () => {
                const submissions = await lc.submissions({ limit: 100, offset: 0 });
                expect(submissions.length).toBe(100);
            },
        );

        it.skipIf(!process.env["TEST_LEETCODE_SESSION"])(
            "should be able to get own information",
            async () => {
                const user = await lc.whoami();
                expect(typeof user.userId).toBe("number");
                expect(user.username.length).toBeGreaterThan(0);
                expect(user.isSignedIn).toBe(true);
            },
        );

        it.skipIf(!process.env["TEST_LEETCODE_SESSION"])(
            "should be able to get submission details",
            async () => {
                const submission = await lc.submission(333333333);
                expect(submission.id).toBe(333333333);
                expect(submission.memory).toBe(34096000);
                expect(submission.runtime).toBe(200);
            },
        );
    });
});
