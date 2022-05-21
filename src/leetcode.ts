import EventEmitter from "events";
import fetch, { Response } from "node-fetch";
import { Cache, cache as default_cache } from "./cache";
import { BASE_URL, USER_AGENT } from "./constants";
import { Credential } from "./credential";
import type {
    Problem,
    RecentSubmission,
    Submission,
    UserContestInfo,
    UserProfile,
    Whoami,
} from "./leetcode-types";
import { RateLimiter } from "./mutex";
import type { LeetCodeGraphQLQuery, LeetCodeGraphQLResponse } from "./types";
import { parse_cookie } from "./utils";

export class LeetCode extends EventEmitter {
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
     * Rate limiter
     */
    public limiter = new RateLimiter();

    /**
     * If a credential is provided, the LeetCode API will be authenticated. Otherwise, it will be anonymous.
     * @param credential
     * @param cache
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
     *
     * @returns
     *
     * ```javascript
     * const credential = new Credential();
     * await credential.init("SESSION");
     * const leetcode = new LeetCode(credential);
     * const submissions = await leetcode.get_submissions({ limit: 100, offset: 0 });
     * ```
     */
    public async get_submissions({
        limit = 20,
        offset = 0,
        slug,
    }: { limit?: number; offset?: number; slug?: string } = {}): Promise<Submission[]> {
        await this.initialized;

        const submissions: Submission[] = [];
        const set = new Set<number>();

        let cursor = offset;
        while (submissions.length < limit) {
            const { data } = await this.graphql({
                operationName: "Submissions",
                variables: {
                    offset: cursor,
                    limit: limit - submissions.length > 20 ? 20 : limit - submissions.length,
                    slug,
                },
                query: `query Submissions($offset: Int!, $limit: Int!, $slug: String) {
                    submissionList(offset: $offset, limit: $limit, questionSlug: $slug) {
                        hasNext
                        submissions { id lang time timestamp statusDisplay runtime url isPending title memory titleSlug }
                    }
                }`,
            });

            for (const submission of data.submissionList.submissions) {
                submission.id = parseInt(submission.id, 10);
                submission.timestamp = parseInt(submission.timestamp, 10) * 1000;
                submission.isPending = submission.isPending !== "Not Pending";
                submission.runtime = parseInt(submission.runtime, 10) || 0;
                submission.memory = parseFloat(submission.memory) || 0;

                if (set.has(submission.id)) {
                    continue;
                }

                set.add(submission.id);
                submissions.push(submission);
            }

            if (!data.submissionList.hasNext) {
                break;
            }

            cursor += 20;
        }

        return submissions;
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
                  note
                }
              }`,
        });

        return data.question as Problem;
    }

    /**
     * Check the information of the credential owner.
     * @returns
     */
    public async whoami(): Promise<Whoami> {
        await this.initialized;
        const { data } = await this.graphql({
            operationName: "globalData",
            variables: {},
            query: `query globalData {
                userStatus {
                  userId
                  username
                  avatar
                  isSignedIn
                  isMockUser
                  isPremium
                  isAdmin
                  isSuperuser
                  isTranslator
                  permissions
                }
              }`,
        });

        return data.userStatus as Whoami;
    }

    /**
     * Use GraphQL to query LeetCode API.
     * @param query
     * @returns
     */
    public async graphql(query: LeetCodeGraphQLQuery): Promise<LeetCodeGraphQLResponse> {
        await this.initialized;

        try {
            await this.limiter.lock();

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

            this.limiter.unlock();
            return res.json();
        } catch (err) {
            this.limiter.unlock();
            throw err;
        }
    }
}

export declare interface LeetCode {
    emit(event: "receive-graphql", res: Response): boolean;
    emit(event: "update-csrf", credential: Credential): boolean;
    emit(event: string, ...args: unknown[]): boolean;

    on(event: "receive-graphql", listener: (res: Response) => void): this;
    on(event: "update-csrf", listener: (credential: Credential) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;

    once(event: "receive-graphql", listener: (res: Response) => void): this;
    once(event: "update-csrf", listener: (credential: Credential) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
}

export default LeetCode;
