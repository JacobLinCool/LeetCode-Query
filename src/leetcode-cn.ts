import fetch from "node-fetch";
import type { LeetCodeGraphQLQuery, LeetCodeGraphQLResponse } from "./types";
import { BASE_URL_CN, USER_AGENT } from "./constants";
import { Credential } from "./credential-cn";
import { Cache, cache as default_cache } from "./cache";

class LeetCodeCN {
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
     * If a credential is provided, the LeetCodeCN API will be authenticated. Otherwise, it will be anonymous.
     * @param credential
     */
    constructor(credential: Credential | null = null, cache: Cache | null = null) {
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
     * const leetcode = new LeetCodeCN();
     * const profile = await leetcode.get_user("jacoblincool");
     * ```
     */
    public async get_user(username: string): Promise<unknown> {
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
     * @returns
     */
    public async graphql(query: LeetCodeGraphQLQuery): Promise<LeetCodeGraphQLResponse> {
        await this.initialized;

        const BASE = BASE_URL_CN;
        const res = await fetch(`${BASE}/graphql`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: BASE,
                referer: BASE,
                cookie: `csrftoken=${this.credential.csrf || ""}; `,
                "x-csrftoken": this.credential.csrf || "",
                "user-agent": USER_AGENT,
            },
            body: JSON.stringify(query),
        });

        return await res.json();
    }
}

export default LeetCodeCN;
export { LeetCodeCN };
