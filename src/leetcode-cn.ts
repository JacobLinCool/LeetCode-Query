import EventEmitter from "events";
import fetch, { Response } from "node-fetch";
import { Cache, cache as default_cache } from "./cache";
import { BASE_URL_CN, USER_AGENT } from "./constants";
import { Credential } from "./credential-cn";
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
     * const profile = await leetcode.get_user("jacoblincool");
     * ```
     */
    public async user(username: string): Promise<UserResult> {
        await this.initialized;
        const { data } = await this.graphql({
            operationName: "getUserProfile",
            variables: { username },
            query: `
            query getUserProfile($username: String!) {
                userProfileUserQuestionProgress(userSlug: $username) {
                    numAcceptedQuestions { difficulty count }
                    numFailedQuestions { difficulty count }
                    numUntouchedQuestions { difficulty count }
                }
                userProfilePublicProfile(userSlug: $username) {
                    username haveFollowed siteRanking
                    profile { 
                        userSlug realName aboutMe userAvatar location gender websites skillTags contestCount asciiCode
                        medals { name year month category }
                        ranking { 
                            currentLocalRanking currentGlobalRanking currentRating totalLocalUsers totalGlobalUsers
                        }
                        socialAccounts { provider profileUrl }
                    }
                }
            }
            `,
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

export declare interface LeetCodeCN {
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

export default LeetCodeCN;

export interface NumAcceptedQuestion {
    difficulty: string;
    count: number;
}

export interface NumFailedQuestion {
    difficulty: string;
    count: number;
}

export interface NumUntouchedQuestion {
    difficulty: string;
    count: number;
}

export interface UserProfileUserQuestionProgress {
    numAcceptedQuestions: NumAcceptedQuestion[];
    numFailedQuestions: NumFailedQuestion[];
    numUntouchedQuestions: NumUntouchedQuestion[];
}

export interface Medal {
    name: string;
    year: number;
    month: number;
    category: string;
}

export interface Ranking {
    currentLocalRanking: number;
    currentGlobalRanking: number;
    currentRating: string;
    totalLocalUsers: number;
    totalGlobalUsers: number;
}

export interface SocialAccount {
    provider: string;
    profileUrl: string;
}

export interface Profile {
    userSlug: string;
    realName: string;
    aboutMe: string;
    userAvatar: string;
    location: string;
    gender: string;
    websites: any[];
    skillTags: string[];
    contestCount: number;
    asciiCode: string;
    medals: Medal[];
    ranking: Ranking;
    socialAccounts: SocialAccount[];
}

export interface UserProfilePublicProfile {
    username: string;
    haveFollowed?: any;
    siteRanking: number;
    profile: Profile;
}

export interface UserResult {
    userProfileUserQuestionProgress: UserProfileUserQuestionProgress;
    userProfilePublicProfile: UserProfilePublicProfile;
}
