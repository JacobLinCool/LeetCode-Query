import EventEmitter from "eventemitter3";
import { Cache, cache as default_cache } from "./cache";
import { BASE_URL_CN, USER_AGENT } from "./constants";
import { Credential } from "./credential-cn";
import fetch from "./fetch";
import PROBLEM_SET from "./graphql/leetcode-cn/problem-set.graphql?raw";
import PROBLEM from "./graphql/leetcode-cn/problem.graphql?raw";
import QUESTION_OF_TODAY from "./graphql/leetcode-cn/question-of-today.graphql?raw";
import RECENT_AC_SUBMISSIONS from "./graphql/leetcode-cn/recent-ac-submissions.graphql?raw";
import SUBMISSION_DETAIL from "./graphql/leetcode-cn/submission-detail.graphql?raw";
import USER_CONTEST from "./graphql/leetcode-cn/user-contest-ranking.graphql?raw";
import USER_PROBLEM_SUBMISSIONS from "./graphql/leetcode-cn/user-problem-submissions.graphql?raw";
import USER_PROFILE from "./graphql/leetcode-cn/user-profile.graphql?raw";
import USER_PROGRESS_QUESTIONS from "./graphql/leetcode-cn/user-progress-questions.graphql?raw";
import USER_STATUS from "./graphql/leetcode-cn/user-status.graphql?raw";
import { RateLimiter } from "./mutex";
import type { LeetCodeGraphQLQuery, LeetCodeGraphQLResponse } from "./types";
import { parse_cookie } from "./utils";

export class LeetCodeCN extends EventEmitter {
    /**
     * The credential this LeetCodeCN instance is using.
     */
    public credential: Credential;

    /**
     * The internal cache.
     */
    public cache: Cache;

    /**
     * Used to ensure the LeetCodeCN instance is initialized.
     */
    private initialized: Promise<boolean>;

    /**
     * Rate limiter
     */
    public limiter = new RateLimiter();

    /**
     * If a credential is provided, the LeetCodeCN API will be authenticated. Otherwise, it will be anonymous.
     * @param credential
     * @param cache
     */
    constructor(credential: Credential | null = null, cache = default_cache) {
        super();
        let initialize: CallableFunction;
        this.initialized = new Promise((resolve) => {
            initialize = resolve;
        });

        this.cache = cache;

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
     * const leetcode = new LeetCodeCN();
     * const profile = await leetcode.user("leetcode");
     * ```
     */
    public async user(username: string): Promise<UserProfile> {
        await this.initialized;
        const { data } = await this.graphql({
            variables: { username },
            query: USER_PROFILE,
        });
        return data;
    }

    /**
     * Get public contest info of a user.
     * @param username
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCodeCN();
     * const profile = await leetcode.user_contest_info("username");
     * ```
     */
    public async user_contest_info(username: string): Promise<UserContestInfo> {
        await this.initialized;
        const { data } = await this.graphql(
            {
                operationName: "userContestRankingInfo",
                variables: { username },
                query: USER_CONTEST,
            },
            "/graphql/noj-go/",
        );
        return data as UserContestInfo;
    }

    /**
     * Get recent submissions of a user. (max: 20 submissions)
     * @param username
     * @param limit
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCodeCN();
     * const submissions = await leetcode.recent_submissions("username");
     * ```
     */
    public async recent_submissions(username: string): Promise<RecentSubmission[]> {
        await this.initialized;
        const { data } = await this.graphql(
            {
                variables: { username },
                query: RECENT_AC_SUBMISSIONS,
            },
            "/graphql/noj-go/",
        );
        return (data.recentACSubmissions as RecentSubmission[]) || [];
    }

    /**
     * Get submissions of a problem.
     * @param limit The number of submissions to get. Default is 20.
     * @param offset The offset of the submissions to get. Default is 0.
     * @param slug The slug of the problem. Required.
     * @param param0
     * @returns
     */
    public async problem_submissions({
        limit = 20,
        offset = 0,
        slug,
        lang,
        status,
    }: {
        limit?: number;
        offset?: number;
        slug?: string;
        lang?: string;
        status?: string;
    } = {}): Promise<Submission[]> {
        await this.initialized;

        if (!slug) {
            throw new Error("LeetCodeCN requires slug parameter for submissions");
        }

        const submissions: Submission[] = [];
        const set = new Set<number>();

        let cursor = offset;
        while (submissions.length < limit) {
            const { data } = await this.graphql({
                variables: {
                    offset: cursor,
                    limit: limit - submissions.length > 20 ? 20 : limit - submissions.length,
                    questionSlug: slug,
                    lang,
                    status,
                },
                query: USER_PROBLEM_SUBMISSIONS,
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
     * Get user progress questions. Need to be authenticated.
     * @returns
     */
    public async user_progress_questions(filters: {
        skip: number;
        limit: number;
    }): Promise<UserProgressQuestionList> {
        await this.initialized;
        const { data } = await this.graphql({
            variables: { filter: filters },
            query: USER_PROGRESS_QUESTIONS,
        });
        return data.userProgressQuestionList as UserProgressQuestionList;
    }

    /**
     * Get a list of problems by tags and difficulty.
     * @param option
     * @param option.category
     * @param option.offset
     * @param option.limit
     * @param option.filters
     * @returns
     */
    public async problems({
        category = "",
        offset = 0,
        limit = 100,
        filters = {},
    }: {
        category?: string;
        offset?: number;
        limit?: number;
        filters?: {
            difficulty?: "EASY" | "MEDIUM" | "HARD";
            tags?: string[];
        };
    } = {}): Promise<ProblemList> {
        await this.initialized;

        const variables = { categorySlug: category, skip: offset, limit, filters };

        const { data } = await this.graphql({
            variables,
            query: PROBLEM_SET,
        });

        return data.problemsetQuestionList as ProblemList;
    }

    /**
     * Get information of a problem by its slug.
     * @param slug Problem slug
     * @returns
     *
     * ```javascript
     * const leetcode = new LeetCodeCN();
     * const problem = await leetcode.problem("two-sum");
     * ```
     */
    public async problem(slug: string): Promise<Problem> {
        await this.initialized;
        const { data } = await this.graphql({
            variables: { titleSlug: slug.toLowerCase().replace(/\s/g, "-") },
            query: PROBLEM,
        });

        return data.question as Problem;
    }

    /**
     * Get daily challenge.
     * @returns
     *
     * @example
     * ```javascript
     * const leetcode = new LeetCodeCN();
     * const daily = await leetcode.daily();
     * ```
     */
    public async daily(): Promise<DailyChallenge> {
        await this.initialized;
        const { data } = await this.graphql({
            query: QUESTION_OF_TODAY,
        });

        return data.todayRecord[0] as DailyChallenge;
    }

    /**
     * Check the status information of the current user.
     * @returns User status information including login state and permissions
     */
    public async userStatus(): Promise<UserStatus> {
        await this.initialized;
        const { data } = await this.graphql({
            query: USER_STATUS,
        });

        return data.userStatus as UserStatus;
    }

    /**
     * Get detailed information about a submission.
     * @param submissionId The ID of the submission
     * @returns Detailed information about the submission
     *
     * ```javascript
     * const leetcode = new LeetCodeCN();
     * const detail = await leetcode.submissionDetail("123456789");
     * ```
     */
    public async submissionDetail(submissionId: string): Promise<SubmissionDetailResult> {
        await this.initialized;
        const { data } = await this.graphql({
            operationName: "submissionDetails",
            variables: { submissionId },
            query: SUBMISSION_DETAIL,
        });
        return data;
    }

    /**
     * Use GraphQL to query LeetCodeCN API.
     * @param query
     * @param endpoint Maybe you want to use `/graphql/noj-go/` instead of `/graphql/`.
     * @returns
     */
    public async graphql(
        query: LeetCodeGraphQLQuery,
        endpoint = "/graphql/",
    ): Promise<LeetCodeGraphQLResponse> {
        await this.initialized;

        try {
            await this.limiter.lock();
            const BASE = BASE_URL_CN;
            const res = await fetch(`${BASE}${endpoint}`, {
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
                    ...query.headers,
                },
                body: JSON.stringify(query),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
            }

            this.emit("receive-graphql", res);

            if (res.headers.has("set-cookie")) {
                const cookies = parse_cookie(res.headers.get("set-cookie") || "");

                if (cookies["csrftoken"]) {
                    this.credential.csrf = cookies["csrftoken"];
                    this.emit("update-csrf", this.credential);
                }
            }

            this.limiter.unlock();
            return res.json() as Promise<LeetCodeGraphQLResponse>;
        } catch (err) {
            this.limiter.unlock();
            throw err;
        }
    }

    emit(event: "receive-graphql", res: Response): boolean;
    emit(event: "update-csrf", credential: Credential): boolean;
    emit(event: string, ...args: unknown[]): boolean;
    emit(event: string, ...args: unknown[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: "receive-graphql", listener: (res: Response) => void): this;
    on(event: "update-csrf", listener: (credential: Credential) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: "receive-graphql", listener: (res: Response) => void): this;
    once(event: "update-csrf", listener: (credential: Credential) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }
}

export default LeetCodeCN;

export interface UserProfile {
    userProfileUserQuestionProgress: {
        numAcceptedQuestions: Array<{
            count: number;
            difficulty: string;
        }>;
        numFailedQuestions: Array<{
            count: number;
            difficulty: string;
        }>;
        numUntouchedQuestions: Array<{
            count: number;
            difficulty: string;
        }>;
    };
    userProfilePublicProfile: {
        haveFollowed: boolean;
        siteRanking: number;
        profile: {
            userSlug: string;
            realName: string;
            aboutMe: string;
            asciiCode: string;
            userAvatar: string;
            gender: string;
            websites: string[];
            skillTags: string[];
            ipRegion: string;
            birthday: string;
            location: string;
            useDefaultAvatar: boolean;
            certificationLevel: string;
            github: string;
            school: {
                schoolId: string;
                logo: string;
                name: string;
            };
            company: {
                id: string;
                logo: string;
                name: string;
            };
            job: string;
            globalLocation: {
                country: string;
                province: string;
                city: string;
                overseasCity: string;
            };
            socialAccounts: Array<{
                provider: string;
                profileUrl: string;
            }>;
            skillSet: {
                langLevels: Array<{
                    langName: string;
                    langVerboseName: string;
                    level: number;
                }>;
                topics: Array<{
                    slug: string;
                    name: string;
                    translatedName: string;
                }>;
                topicAreaScores: Array<{
                    score: number;
                    topicArea: {
                        name: string;
                        slug: string;
                    };
                }>;
            };
        };
        educationRecordList: Array<{
            unverifiedOrganizationName: string;
        }>;
        occupationRecordList: Array<{
            unverifiedOrganizationName: string;
            jobTitle: string;
        }>;
    };
}

export interface UserContestInfo {
    userContestRanking: {
        attendedContestsCount: number;
        rating: number;
        globalRanking: number;
        localRanking: number;
        globalTotalParticipants: number;
        localTotalParticipants: number;
        topPercentage: number;
    };
    userContestRankingHistory: Array<{
        attended: boolean;
        totalProblems: number;
        trendingDirection: string;
        finishTimeInSeconds: number;
        rating: number;
        score: number;
        ranking: number;
        contest: {
            title: string;
            titleCn: string;
            startTime: number;
        };
    }>;
}

export interface RecentSubmission {
    submissionId: string;
    submitTime: number;
    question: {
        title: string;
        translatedTitle: string;
        titleSlug: string;
        questionFrontendId: string;
    };
}

export interface Submission {
    id: number;
    title: string;
    status: string;
    statusDisplay: string;
    lang: string;
    langName: string;
    runtime: number;
    timestamp: number;
    url: string;
    isPending: boolean;
    memory: number;
    frontendId: string;
    submissionComment: {
        comment: string;
        flagType: string;
    };
}

export interface ProblemList {
    hasMore: boolean;
    total: number;
    questions: Array<{
        acRate: number;
        difficulty: string;
        freqBar: number;
        frontendQuestionId: string;
        isFavor: boolean;
        paidOnly: boolean;
        solutionNum: number;
        status: string;
        title: string;
        titleCn: string;
        titleSlug: string;
        topicTags: Array<{
            name: string;
            nameTranslated: string;
            id: string;
            slug: string;
        }>;
    }>;
}

export interface Problem {
    questionId: string;
    questionFrontendId: string;
    boundTopicId: string;
    title: string;
    titleSlug: string;
    content: string;
    translatedTitle: string;
    translatedContent: string;
    isPaidOnly: boolean;
    difficulty: string;
    likes: number;
    dislikes: number;
    isLiked: boolean;
    similarQuestions: string;
    exampleTestcases: string;
    contributors: Array<{
        username: string;
        profileUrl: string;
        avatarUrl: string;
    }>;
    topicTags: Array<{
        name: string;
        slug: string;
        translatedName: string;
    }>;
    companyTagStats: string;
    codeSnippets: Array<{
        lang: string;
        langSlug: string;
        code: string;
    }>;
    stats: string;
    hints: string[];
    solution: {
        id: string;
        canSeeDetail: boolean;
    };
    status: string;
    sampleTestCase: string;
    metaData: string;
    judgerAvailable: boolean;
    judgeType: string;
    mysqlSchemas: string[];
    enableRunCode: boolean;
    enableTestMode: boolean;
    libraryUrl: string;
    note: string;
}

export interface DailyChallenge {
    date: string;
    userStatus: string;
    question: {
        questionId: string;
        frontendQuestionId: string;
        difficulty: string;
        title: string;
        titleCn: string;
        titleSlug: string;
        paidOnly: boolean;
        freqBar: number;
        isFavor: boolean;
        acRate: number;
        status: string;
        solutionNum: number;
        hasVideoSolution: boolean;
        topicTags: Array<{
            name: string;
            nameTranslated: string;
            id: string;
        }>;
        extra: {
            topCompanyTags: Array<{
                imgUrl: string;
                slug: string;
                numSubscribed: number;
            }>;
        };
    };
    lastSubmission: {
        id: string;
    };
}

export interface UserStatus {
    isSignedIn: boolean;
    isAdmin: boolean;
    isStaff: boolean;
    isSuperuser: boolean;
    isTranslator: boolean;
    isVerified: boolean;
    isPhoneVerified: boolean;
    isWechatVerified: boolean;
    checkedInToday: boolean;
    username: string;
    realName: string;
    userSlug: string;
    avatar: string;
    region: string;
    permissions: string[];
    useTranslation: boolean;
}

export interface UserProgressQuestionList {
    totalNum: number;
    questions: Array<{
        translatedTitle: string;
        frontendId: string;
        title: string;
        titleSlug: string;
        difficulty: string;
        lastSubmittedAt: string;
        numSubmitted: number;
        questionStatus: string;
        lastResult: string;
        topicTags: Array<{
            name: string;
            nameTranslated: string;
            slug: string;
        }>;
    }>;
}

export interface UserProgressQuestionListInput {
    skip: number;
    limit: number;
}

export interface SubmissionQuestion {
    questionId: string;
    titleSlug: string;
    hasFrontendPreview: boolean;
}

export interface SubmissionUser {
    realName: string;
    userAvatar: string;
    userSlug: string;
}

export interface OutputDetail {
    codeOutput: string;
    expectedOutput: string;
    input: string;
    compileError: string;
    runtimeError: string;
    lastTestcase: string;
}

export interface SubmissionDetail {
    code: string;
    timestamp: number;
    statusDisplay: string;
    isMine: boolean;
    runtimeDisplay: string;
    memoryDisplay: string;
    memory: string;
    lang: string;
    langVerboseName: string;
    question: SubmissionQuestion;
    user: SubmissionUser;
    runtimePercentile: number;
    memoryPercentile: number;
    submissionComment: null | {
        flagType: string;
    };
    passedTestCaseCnt: number;
    totalTestCaseCnt: number;
    fullCodeOutput: null | string;
    testDescriptions: null | string;
    testInfo: null | string;
    testBodies: null | string;
    stdOutput: string;
    outputDetail: OutputDetail;
}

export interface SubmissionDetailResult {
    submissionDetail: SubmissionDetail;
}
