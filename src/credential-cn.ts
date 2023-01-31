import fetch from "node-fetch";
import { BASE_URL_CN, USER_AGENT } from "./constants";
import type { ICredential } from "./types";
import { parse_cookie } from "./utils";

async function get_csrf() {
    const res = await fetch(`${BASE_URL_CN}/graphql/`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "user-agent": USER_AGENT,
        },
        body: JSON.stringify({
            operationName: "nojGlobalData",
            variables: {},
            query: "query nojGlobalData {\n  siteRegion\n  chinaHost\n  websocketUrl\n}\n",
        }),
    });
    const cookies_raw = res.headers.get("set-cookie") as string;

    const csrf_token = parse_cookie(cookies_raw).csrftoken;
    return csrf_token;
}

class Credential implements ICredential {
    /**
     * The authentication session.
     */
    public session?: string;

    /**
     * The csrf token.
     */
    public csrf?: string;

    constructor(data?: ICredential) {
        if (data) {
            this.session = data.session;
            this.csrf = data.csrf;
        }
    }

    /**
     * Init the credential with or without leetcode session cookie.
     * @param session
     * @returns
     */
    public async init(session?: string): Promise<this> {
        this.csrf = await get_csrf();
        if (session) this.session = session;
        return this;
    }
}

export default Credential;
export { Credential };