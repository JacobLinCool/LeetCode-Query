///////////////////////////////////////////////////////////////////////////////
// Cache
export interface CacheItem {
    /**
     * The key of the item.
     */
    key: string;

    /**
     * The value of the item.
     */
    value: any;

    /**
     * The expiration time of the item in milliseconds since the Unix epoch.
     */
    expires: number;
}

/**
 * A simple in-memory cache table.
 */
export interface CacheTable {
    [key: string]: CacheItem;
}

///////////////////////////////////////////////////////////////////////////////
// Credential
export interface ICredential {
    /**
     * The authentication session.
     */
    session?: string;

    /**
     * The csrf token.
     */
    csrf?: string;
}

///////////////////////////////////////////////////////////////////////////////
// LeetCode GraphQL
export interface LeetCodeGraphQLQuery {
    operationName: string;
    variables: { [key: string]: any };
    query: string;
}
