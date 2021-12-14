export function parse_cookie(cookie: string) {
    return cookie
        .split(";")
        .map((x) => x.trim().split("="))
        .reduce((acc, x) => {
            acc[x[0]] = x[1];
            return acc;
        }, {} as Record<string, string>);
}

export function sleep(ms: number, val: any = null) {
    return new Promise((resolve) => setTimeout(() => resolve(val), ms));
}
