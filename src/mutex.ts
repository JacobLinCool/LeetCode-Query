import EventEmitter from "eventemitter3";

export type Release = (value: void | PromiseLike<void>) => void;

export class Mutex extends EventEmitter {
    protected space: number;
    protected used: number;
    protected releases: Release[];

    constructor(space = 1) {
        super();
        this.space = space;
        this.used = 0;
        this.releases = [];
    }

    async lock(): Promise<number> {
        if (this.used >= this.space) {
            const lock = new Promise<void>((r) => this.releases.push(r));
            this.emit("wait", {
                lock,
                release: this.releases[this.releases.length - 1],
            });
            await lock;
        }
        this.used++;
        this.emit("lock");

        return this.used;
    }

    unlock(): number {
        if (this.used <= 0) {
            return 0;
        }

        if (this.releases.length > 0) {
            this.releases.shift()?.();
        }
        this.used--;
        this.emit("unlock");

        if (this.used <= 0) {
            this.emit("all-clear");
        }

        return this.used;
    }

    resize(space: number): number {
        this.space = space;

        while (this.used < space && this.releases.length > 0) {
            this.releases.shift()?.();
        }

        return this.space;
    }

    full(): boolean {
        return this.used >= this.space;
    }

    waiting(): number {
        return this.releases.length;
    }

    emit(event: "lock" | "unlock" | "all-clear"): boolean;
    emit(event: "wait", { lock, release }: { lock: Promise<void>; release: Release }): boolean;
    emit(event: string): boolean;
    emit(event: string, ...args: unknown[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: "lock" | "unlock" | "all-clear", listener: () => void): this;
    on(
        event: "wait",
        listener: ({ lock, release }: { lock: Promise<void>; release: Release }) => void,
    ): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: "lock" | "unlock" | "all-clear", listener: () => void): this;
    once(
        event: "wait",
        listener: ({ lock, release }: { lock: Promise<void>; release: Release }) => void,
    ): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }
}

export class RateLimiter extends Mutex {
    private time_mutex: Mutex;
    private count = 0;
    private last = 0;
    private timer?: NodeJS.Timeout;
    public interval: number;

    constructor({ limit = 20, interval = 10_000, concurrent = 2 } = {}) {
        super(concurrent);
        this.time_mutex = new Mutex(limit);
        this.interval = interval;

        this.time_mutex.on("lock", (...args) => this.emit("time-lock", ...args));
        this.time_mutex.on("unlock", (...args) => this.emit("time-unlock", ...args));
    }

    async lock(): Promise<number> {
        if (this.last + this.interval < Date.now()) {
            this.reset();
        } else if (this.time_mutex.full() && !this.timer) {
            this.cleaner();
        }

        await this.time_mutex.lock();
        this.count++;
        return super.lock();
    }

    reset(): void {
        while (this.count > 0) {
            this.time_mutex.unlock();
            this.count--;
        }

        this.last = Date.now();

        this.emit("timer-reset");
    }

    cleaner(): void {
        this.timer = setTimeout(
            () => {
                this.reset();

                setTimeout(() => {
                    if (this.time_mutex.waiting() > 0) {
                        this.cleaner();
                    } else {
                        this.timer = undefined;
                    }
                }, 0);
            },
            this.last + this.interval - Date.now(),
        );
    }

    set limit(limit: number) {
        this.time_mutex.resize(limit);
    }

    emit(event: "lock" | "unlock" | "all-clear"): boolean;
    emit(event: "wait", { lock, release }: { lock: Promise<void>; release: Release }): boolean;
    emit(event: "time-lock" | "time-unlock" | "timer-reset"): boolean;
    emit(event: string): boolean;
    emit(event: string, ...args: unknown[]): boolean {
        // @ts-expect-error super
        return super.emit(event, ...args);
    }

    on(event: "lock" | "unlock" | "all-clear", listener: () => void): this;
    on(
        event: "wait",
        listener: ({ lock, release }: { lock: Promise<void>; release: Release }) => void,
    ): this;
    on(event: "time-lock" | "time-unlock" | "timer-reset", listener: () => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: "lock" | "unlock" | "all-clear", listener: () => void): this;
    once(
        event: "wait",
        listener: ({ lock, release }: { lock: Promise<void>; release: Release }) => void,
    ): this;
    once(event: "time-lock" | "time-unlock" | "timer-reset", listener: () => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }
}
