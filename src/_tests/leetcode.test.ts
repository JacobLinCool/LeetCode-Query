import dotenv from "dotenv";
import { Cache } from "../cache";
import { Credential } from "../credential";
import { LeetCode } from "../leetcode";

jest.setTimeout(15_000);

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
        lc.limiter.limit = 100;
        lc.limiter.interval = 3;
        lc.on("receive-graphql", async (res) => {
            await res.json();
        });

        it("should be able to get user profile", async () => {
            const user = await lc.user("jacoblincool");
            expect(user.matchedUser?.username.toLowerCase()).toBe("jacoblincool");
        });

        it("should be able to get user's recent submissions", async () => {
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

        it("should be not able to get user's submissions", async () => {
            await expect(lc.submissions({ limit: 30, offset: 0 })).rejects.toThrow();
        });

        it("should be able to get user's contest informations", async () => {
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
    });

    describe("Authenticated", () => {
        dotenv.config();
        const credential = new Credential();
        let lc: LeetCode;

        beforeAll(async () => {
            await credential.init(process.env["TEST_LEETCODE_SESSION"]);
            lc = new LeetCode(credential);
        });

        ifit(!!process.env["TEST_LEETCODE_SESSION"])(
            "should be able to get user's submissions",
            async () => {
                const submissions = await lc.submissions({ limit: 100, offset: 0 });
                expect(submissions.length).toBe(100);
            },
        );

        ifit(!!process.env["TEST_LEETCODE_SESSION"])(
            "should be able to get user's information",
            async () => {
                const user = await lc.whoami();
                expect(typeof user.userId).toBe("number");
                expect(user.username.length).toBeGreaterThan(0);
                expect(user.isSignedIn).toBe(true);
            },
        );

        ifit(!!process.env["TEST_LEETCODE_SESSION"])(
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

function ifit(condition = true) {
    return condition ? it : it.skip;
}
