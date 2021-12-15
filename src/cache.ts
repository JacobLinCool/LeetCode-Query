import type { CacheTable } from "./types";

/**
 * Cache class
 */
class Cache {
    private _table: CacheTable = {};

    /**
     * Get an item from the cache.
     * @param key The key of the item.
     * @returns {any} The item, or null if it doesn't exist.
     */
    public get(key: string): unknown {
        const item = this._table[key];
        if (item) {
            if (item.expires > Date.now()) {
                return item.value;
            }
            this.remove(key);
        }
        return null;
    }

    /**
     * Set an item in the cache.
     * @param key The key of the item.
     * @param value The value of the item.
     * @param expires The time in milliseconds until the item expires.
     */
    public set(key: string, value: unknown, expires = 60000): void {
        this._table[key] = {
            key,
            value,
            expires: expires > 0 ? Date.now() + expires : 0,
        };
    }

    /**
     * Remove an item from the cache.
     * @param key The key of the item.
     */
    public remove(key: string): void {
        delete this._table[key];
    }

    /**
     * Clear the cache.
     */
    public clear(): void {
        this._table = {};
    }

    /**
     * Load the cache from a JSON string.
     * @param json A {@link CacheTable}-like JSON string.
     */
    public load(json: string): void {
        this._table = JSON.parse(json);
    }
}

const cache = new Cache();
const caches: { [key: string]: Cache } = { default: cache };

export default cache;
export { Cache, cache, caches };
