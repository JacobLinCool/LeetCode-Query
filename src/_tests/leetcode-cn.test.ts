import dotenv from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";
import { Cache } from "../cache";
import Credential from "../credential-cn";
import { LeetCodeCN } from "../leetcode-cn";

describe("LeetCodeCN", { timeout: 15_000 }, () => {
    describe("General", () => {
        it("should be an instance of LeetCodeCN", () => {
            const lc = new LeetCodeCN();
            expect(lc).toBeInstanceOf(LeetCodeCN);
        });

        it("should be able to use user-specified cache", () => {
            const lc = new LeetCodeCN(null, new Cache());
            expect(lc).toBeInstanceOf(LeetCodeCN);
            expect(lc.cache).toBeInstanceOf(Cache);
        });
    });

    describe("Authenticated", () => {
        dotenv.config();
        const credential = new Credential();
        let lc: LeetCodeCN;

        beforeAll(async () => {
            await credential.init(process.env["TEST_CN_LEETCODE_SESSION"]);
            lc = new LeetCodeCN(credential);
        });

        it.skipIf(!process.env["TEST_CN_LEETCODE_SESSION"])(
            "should be able to get own submissions with slug",
            async () => {
                const submissions = await lc.problem_submissions({
                    limit: 30,
                    offset: 0,
                    slug: "two-sum",
                    lang: "cpp",
                    status: "AC",
                });
                expect(Array.isArray(submissions)).toBe(true);
                if (submissions.length > 0) {
                    expect(submissions[0].status).toBe("AC");
                }
            },
        );

        it.skipIf(!process.env["TEST_CN_LEETCODE_SESSION"])(
            "should be able to get user progress questions",
            async () => {
                const progress = await lc.user_progress_questions({
                    skip: 0,
                    limit: 20,
                });
                expect(progress).toBeDefined();
            },
        );

        it.skipIf(!process.env["TEST_CN_LEETCODE_SESSION"])(
            "should be able to get user signed in status",
            async () => {
                const user = await lc.userStatus();
                expect(user.isSignedIn).toBe(true);
            },
        );

        it.skipIf(
            !process.env["TEST_CN_LEETCODE_SESSION"] || !process.env["TEST_CN_SUBMISSION_ID"],
        )("should be able to get submission detail", async () => {
            const submissionId = process.env["TEST_CN_SUBMISSION_ID"];
            if (submissionId) {
                const submissionDetail = await lc.submissionDetail(submissionId);
                expect(submissionDetail).toBeDefined();
                expect(submissionDetail.id).toBe(submissionId);
                expect(submissionDetail.code).toBeDefined();
            }
        });
    });

    describe("Unauthenticated", () => {
        const lc = new LeetCodeCN();
        lc.limiter.limit = 100;
        lc.limiter.interval = 3;
        lc.on("receive-graphql", async (res) => {
            await res.clone().json();
        });

        it("should be able to get user profile", async () => {
            const user = await lc.user("LeetCode");
            expect(user.userProfilePublicProfile.profile.realName).toBe("LeetCode");
        });

        it("should be able to get user's contest info", async () => {
            const contest = await lc.user_contest_info("LeetCode");
            expect(contest).toBeDefined();
        });

        it("should be able to get user's recent submissions", async () => {
            const submissions = await lc.recent_submissions("LeetCode");
            expect(Array.isArray(submissions)).toBe(true);
        });

        it("should be able to get problems list", async () => {
            const problems = await lc.problems({ limit: 10 });
            expect(problems.questions.length).toBe(10);
        });

        it("should be able to get problem by slug", async () => {
            const problem = await lc.problem("two-sum");
            expect(problem.titleSlug).toBe("two-sum");
        });

        it("should be able to get daily challenge", async () => {
            const daily = await lc.daily();
            expect(daily.question).toBeDefined();
        });

        it("should be able to get user status", async () => {
            const user = await lc.userStatus();
            expect(user.isSignedIn).toBe(false);
        });

        it("should throw error when trying to get submissions without slug", async () => {
            await expect(lc.problem_submissions({ limit: 30, offset: 0 })).rejects.toThrow(
                "LeetCodeCN requires slug parameter for submissions",
            );
        });

        it("should be able to use graphql noj-go", async () => {
            const { data } = await lc.graphql(
                {
                    operationName: "data",
                    variables: { username: "LeetCode" },
                    query: `
                query data($username: String!, $year: Int) {
                    calendar: userCalendar(userSlug: $username, year: $year) {
                      streak
                      totalActiveDays
                      submissionCalendar
                    }
                  }`,
                },
                "/graphql/noj-go/",
            );
            expect(typeof data.calendar.streak).toBe("number");
        });
    });
});
