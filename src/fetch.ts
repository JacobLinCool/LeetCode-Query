import { useCrossFetch } from "@fetch-impl/cross-fetch";
import { Fetcher } from "@fetch-impl/fetcher";

export const fetcher = new Fetcher();
useCrossFetch(fetcher);

export const _fetch = (...args: Parameters<typeof fetch>): ReturnType<typeof fetch> =>
    fetcher.fetch(...args);

export default _fetch;
export { _fetch as fetch };
