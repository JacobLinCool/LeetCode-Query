import Credential from "../credential";
import { LeetCode } from "../leetcode";
import dotenv from "dotenv";

describe("LeetCode", () => {
    describe("Unauthenticated", () => {
        const lc = new LeetCode();

        it("should be an instance of LeetCode", () => {
            expect(lc).toBeInstanceOf(LeetCode);
        });

        it("should be able to get user profile", async () => {
            const user = await lc.get_user("jacoblincool");
            expect(user.matchedUser.username.toLowerCase()).toBe("jacoblincool");
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
    });

    describe("Authenticated", () => {
        dotenv.config();
        const credential = new Credential();
        let lc: LeetCode;

        beforeAll(async () => {
            await credential.init(process.env["TEST_LEETCODE_SESSION"]);
            lc = new LeetCode(credential);
        });

        it("should be able to get user's submissions", async () => {
            const submissions = await lc.get_submissions(100, 0);
            expect(submissions.length).toBe(100);
        });
    });
});
