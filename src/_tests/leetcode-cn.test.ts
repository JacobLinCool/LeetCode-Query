import { describe, expect, it } from "vitest";
import { Cache } from "../cache";
import { LeetCodeCN } from "../leetcode-cn";

describe("LeetCode", { timeout: 15_000 }, () => {
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

    describe("Unauthenticated", () => {
        const lc = new LeetCodeCN();
        lc.limiter.limit = 100;
        lc.limiter.interval = 3;
        lc.on("receive-graphql", async (res) => {
            await res.clone().json();
        });

        it("should be able to get user profile", async () => {
            const user = await lc.user("LeetCode");
            expect(user.userProfilePublicProfile.username).toBe("LeetCode");
        });

        it("should be able to use graphql", async () => {
            const { data } = await lc.graphql({
                operationName: "data",
                variables: { username: "LeetCode" },
                query: `
                query data($username: String!) {
                    progress: userProfileUserQuestionProgress(userSlug: $username) {
                        ac: numAcceptedQuestions { difficulty count }
                        wa: numFailedQuestions { difficulty count }
                        un: numUntouchedQuestions { difficulty count }
                    }
                    user: userProfilePublicProfile(userSlug: $username) {
                        username 
                        ranking: siteRanking
                        profile { 
                            realname: realName 
                            about: aboutMe 
                            avatar: userAvatar 
                            skills: skillTags 
                            country: countryName
                        }
                    }
                    submissions: recentSubmitted(userSlug: $username) {
                        id: submissionId
                        status
                        lang 
                        time: submitTime
                        question { 
                            title: translatedTitle 
                            slug: titleSlug 
                        }
                    }
                }
                `,
            });
            expect(data.user.username).toBe("LeetCode");
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
