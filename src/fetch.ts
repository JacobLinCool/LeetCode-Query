import { fetch as cfetch } from "cross-fetch";

export abstract class FetchImpl {
    abstract fetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch>;

    /**
     * Sets the fetch function to be used.
     * @param f - The fetch function to set.
     */
    public set(f: typeof fetch): void {
        this.fetch = f;
    }
}

export class Fetcher extends FetchImpl {
    fetch = cfetch;
}

/**
 * The fetcher instance used for making requests.
 */
export const fetcher = new Fetcher();
const _fetch = (...args: Parameters<typeof fetch>): ReturnType<typeof fetch> =>
    fetcher.fetch(...args);

export default _fetch;
export { _fetch as fetch };
