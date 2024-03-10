import { BASE_URL, USER_AGENT } from "./constants";
import fetch from "./fetch";
import type { ICredential } from "./types";
import { parse_cookie } from "./utils";

async function get_csrf() {
    const cookies_raw = await fetch(BASE_URL, {
        headers: {
            "user-agent": USER_AGENT,
        },
    }).then((res) => res.headers.get("set-cookie"));
    if (!cookies_raw) {
        return undefined;
    }

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
