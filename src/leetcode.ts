import EventEmitter from "node:events";
import fetch from "node-fetch";
import { Cache, cache as default_cache } from "./cache";
import { BASE_URL, USER_AGENT } from "./constants";
import { Credential } from "./credential";
import type {
    Problem,
    RecentSubmission,
    Submission,
    UserContestInfo,
    UserProfile,
} from "./leetcode-types";
import type { LeetCodeGraphQLQuery, LeetCodeGraphQLResponse } from "./types";
import { parse_cookie, sleep } from "./utils";

class LeetCode extends EventEmitter {
    /**
     * The credential this LeetCode instance is using.
     */
    public credential: Credential;

    /**
     * The internal cache.
     */
    public cache: Cache;

    /**
     * Used to ensure the LeetCode instance is initialized.
     */
    private initialized: Promise<boolean>;

    /**
     * If a credential is provided, the LeetCode API will be authenticated. Otherwise, it will be anonymous.
     * @param credential
     */
    constructor(credential: Credential | null = null, cache: Cache | null = null) {
        super();
        let initialize: CallableFunction;
        this.initialized = new Promise((resolve) => {
            initialize = resolve;
        });

        if (cache) {
            this.cache = cache;
        } else {
            this.cache = default_cache;
        }

        if (credential) {
            this.credential = credential;
            setImmediate(() => initialize());
        } else {
            this.credential = new Credential();
            this.credential.init().then(() => initialize());
        }
    }

    /**
     * Get public profile of a user.
     * @param username
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCode();
     * const profile = await leetcode.get_user("jacoblincool");
     * ```
     */
    public async get_user(username: string): Promise<UserProfile> {
        await this.initialized;
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
        return data as UserProfile;
    }

    /**
     * Get public contest info of a user.
     * @param username
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCode();
     * const profile = await leetcode.get_user_contest_info("jacoblincool");
     * ```
     */
    public async get_user_contest_info(username: string): Promise<UserContestInfo> {
        await this.initialized;
        const { data } = await this.graphql({
            operationName: "userContestRankingInfo",
            variables: { username },
            query: `
            query userContestRankingInfo($username: String!) {
                userContestRanking(username: $username) {
                    attendedContestsCount
                    rating
                    globalRanking
                    totalParticipants
                    topPercentage
                    badge {
                        name
                    }
                }
                userContestRankingHistory(username: $username) {
                    attended
                    trendDirection
                    problemsSolved
                    totalProblems
                    finishTimeInSeconds
                    rating
                    ranking
                    contest {
                        title
                        startTime
                    }
                }
            }
            `,
        });
        return data as UserContestInfo;
    }

    /**
     * Get recent submissions of a user. (max: 20 submissions)
     * @param username
     * @param limit
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCode();
     * const submissions = await leetcode.get_recent_submissions("jacoblincool");
     * ```
     */
    public async get_recent_submissions(username: string, limit = 20): Promise<RecentSubmission[]> {
        await this.initialized;
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
        return (data.recentSubmissionList as RecentSubmission[]) || [];
    }

    /**
     * Get submissions of the credential user. Need to be authenticated.
     * @param limit
     * @param offset
     * @param cooldown (ms)
     * @returns
     *
     * ```javascript
     * const credential = new Credential();
     * await credential.init("SESSION");
     * const leetcode = new LeetCode(credential);
     * const submissions = await leetcode.get_submissions(100, 0);
     * ```
     */
    public async get_submissions(limit = 20, offset = 0, cooldown = 500): Promise<Submission[]> {
        await this.initialized;
        const submissions: unknown[] = [];
        let cursor = offset,
            end = offset + limit;
        while (cursor < end) {
            const data = await fetch(
                `${BASE_URL}/api/submissions/?offset=${cursor}&limit=${
                    end - cursor > 20 ? 20 : end - cursor
                }`,
                {
                    headers: {
                        origin: BASE_URL,
                        referer: BASE_URL,
                        cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${
                            this.credential.session || ""
                        };`,
                        "x-csrftoken": this.credential.csrf || "",
                        "user-agent": USER_AGENT,
                    },
                },
            ).then((res) => res.json());
            try {
                submissions.push(...data.submissions_dump);

                if (data.has_next) {
                    cursor += end - cursor > 20 ? 20 : end - cursor;
                    await sleep(cooldown);
                } else {
                    end = cursor;
                }
            } catch (err) {
                if (data.detail === "Authentication credentials were not provided.") {
                    throw new Error("No LeetCode Credential Provided.");
                }
                if (data.detail) {
                    throw new Error(data.detail);
                }
                throw err;
            }
        }
        return submissions as Submission[];
    }

    /**
     * Get information of a problem by its slug.
     * @param slug Problem slug
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCode();
     * const problem = await leetcode.get_problem("two-sum");
     * ```
     */
    public async get_problem(slug: string): Promise<Problem> {
        await this.initialized;
        const { data } = await this.graphql({
            operationName: "questionData",
            variables: { titleSlug: slug.toLowerCase().replace(/\s/g, "-") },
            query: `query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                  questionId
                  questionFrontendId
                  boundTopicId
                  title
                  titleSlug
                  content
                  translatedTitle
                  translatedContent
                  isPaidOnly
                  difficulty
                  likes
                  dislikes
                  isLiked
                  similarQuestions
                  exampleTestcases
                  contributors {
                    username
                    profileUrl
                    avatarUrl
                  }
                  topicTags {
                    name
                    slug
                    translatedName
                  }
                  companyTagStats
                  codeSnippets {
                    lang
                    langSlug
                    code
                  }
                  stats
                  hints
                  solution {
                    id
                    canSeeDetail
                    paidOnly
                    hasVideoSolution
                    paidOnlyVideo
                  }
                  status
                  sampleTestCase
                  metaData
                  judgerAvailable
                  judgeType
                  mysqlSchemas
                  enableRunCode
                  enableTestMode
                  enableDebugger
                  envInfo
                  libraryUrl
                  adminUrl
                  challengeQuestion {
                    id
                    date
                    incompleteChallengeCount
                    streakCount
                    type
                  }
                }
              }`,
        });

        return data.question as Problem;
    }

    /**
     * Use GraphQL to query LeetCode API.
     * @param query
     * @returns
     */
    public async graphql(query: LeetCodeGraphQLQuery): Promise<LeetCodeGraphQLResponse> {
        await this.initialized;

        const BASE = BASE_URL;
        const res = await fetch(`${BASE}/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: BASE,
                referer: BASE,
                cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${
                    this.credential.session || ""
                };`,
                "x-csrftoken": this.credential.csrf || "",
                "user-agent": USER_AGENT,
            },
            body: JSON.stringify(query),
        });
        this.emit("receive-graphql", res.clone());

        if (res.headers.has("set-cookie")) {
            const cookies = parse_cookie(res.headers.get("set-cookie") as string);

            if (cookies["csrftoken"]) {
                this.credential.csrf = cookies["csrftoken"];
                this.emit("update-csrf", this.credential);
            }
        }

        return res.json();
    }
}

export default LeetCode;
export { LeetCode };
