import fetch from "node-fetch";
import type { LeetCodeGraphQLQuery } from "./types";
import { BASE_URL, USER_AGENT } from "./constants";
import { sleep } from "./utils";
import { Credential } from "./credential";
import { Cache, cache as default_cache } from "./cache";

class LeetCode {
    private credential: Credential;
    private cache: Cache;

    /**
     * If a credential is provided, the LeetCode API will be authenticated. Otherwise, it will be anonymous.
     * @param credential
     */
    constructor(credential: Credential | null = null, cache: Cache | null = null) {
        if (credential) {
            this.credential = credential;
        } else {
            this.credential = new Credential();
            this.credential.init();
        }

        if (cache) {
            this.cache = cache;
        } else {
            this.cache = default_cache;
        }
    }

    /**
     * Get public profile of a user.
     * @param username
     * @returns
     */
    public async get_user(username: string) {
        const { data } = await this.graphql({
            operationName: "getUserProfile",
            variables: { username },
            query: `
            query getUserProfile($username: String!) {
                allQuestionsCount {
                    difficulty
                    count
                }
                matchedUser(username: $username) {
                    username
                    socialAccounts
                    githubUrl
                    contributions {
                        points
                        questionCount
                        testcaseCount
                    }
                    profile {
                        realName
                        websites
                        countryName
                        skillTags
                        company
                        school
                        starRating
                        aboutMe
                        userAvatar
                        reputation
                        ranking
                    }
                    submissionCalendar
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                        totalSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                    badges {
                        id
                        displayName
                        icon
                        creationDate
                    }
                    upcomingBadges {
                        name
                        icon
                    }
                    activeBadge {
                        id
                    }
                }
                recentSubmissionList(username: $username, limit: 20) {
                    title
                    titleSlug
                    timestamp
                    statusDisplay
                    lang
                }
            }
            `,
        });
        return data;
    }

    /**
     * Get recent submissions of a user. (max: 20 submissions)
     * @param username
     * @param limit
     * @returns
     */
    public async get_recent_submissions(username: string, limit = 20) {
        const { data } = await this.graphql({
            operationName: "getRecentSubmissionList",
            variables: { username, limit },
            query: `query getRecentSubmissionList($username: String!, $limit: Int) {
                recentSubmissionList(username: $username, limit: $limit) {
                    title
                    titleSlug
                    timestamp
                    statusDisplay
                    lang
                }
            }`,
        });
        return (data.recentSubmissionList as unknown[]) || [];
    }

    /**
     * Get submissions of the credential user. Need to be authenticated.
     * @param limit
     * @param offset
     * @returns
     */
    public async get_submissions(limit = 20, offset = 0) {
        const submissions: unknown[] = [];
        let cursor = offset,
            end = offset + limit;
        while (cursor < end) {
            const data = await fetch(`${BASE_URL}/api/submissions/?offset=${cursor}&limit=${end - cursor > 20 ? 20 : end - cursor}`, {
                headers: {
                    origin: BASE_URL,
                    referer: BASE_URL,
                    cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${this.credential.session || ""};`,
                    "x-csrftoken": this.credential.csrf || "",
                    "user-agent": USER_AGENT,
                },
            }).then((res) => res.json());

            submissions.push(...data.submissions_dump);

            if (data.has_next) {
                cursor += end - cursor > 20 ? 20 : end - cursor;
                await sleep(300);
            } else {
                end = cursor;
            }
        }
        return submissions;
    }

    /**
     * Use GraphQL to query LeetCode API.
     * @param query
     * @returns
     */
    public async graphql(query: LeetCodeGraphQLQuery) {
        return fetch(`${BASE_URL}/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: BASE_URL,
                referer: BASE_URL,
                cookie: `csrftoken=${this.credential.csrf || ""}; `,
                "x-csrftoken": this.credential.csrf || "",
                "user-agent": USER_AGENT,
            },
            body: JSON.stringify(query),
        }).then((res) => res.json());
    }
}

export default LeetCode;
export { LeetCode };
