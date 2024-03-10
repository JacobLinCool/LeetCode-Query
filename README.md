# LeetCode Query

The API to get user profiles, submissions, and problems on LeetCode, with highly customizable GraphQL API and Rate Limiter.

## Features

### Without Authentication

- [x] Get Public User Profile.
- [x] Get User's Recent Submissions. (Public, Max: 20)
- [x] Get User Contest Records. (thanks to [@laporchen](https://github.com/laporchen))
- [x] Get All Problem List, or with filter of difficulty and tags.
- [x] Get Problem Detail.
- [x] Get Daily Challenge.

### Authenticated

- [x] Get All Submissions of The Authenticated User.
- [x] Get Submission Details, including the code and percentiles.

### Other

- [x] Customable GraphQL Query API.
- [x] Customable Rate Limiter. (Default: 20 req / 10 sec)
- [x] Customable Fetcher.

## Examples

### Get An User's Public Profile

Includes recent submissions and posts.

```typescript
import { LeetCode } from "leetcode-query";

const leetcode = new LeetCode();
const user = await leetcode.user("username");
```

### Get All Of Your Submissions

```typescript
import { LeetCode, Credential } from "leetcode-query";

const credential = new Credential();
await credential.init("YOUR-LEETCODE-SESSION-COOKIE");

const leetcode = new LeetCode(credential);
console.log(await leetcode.submissions(100, 0));
```

### Use Custom Fetcher

You can use your own fetcher, for example, fetch through a real browser.

```typescript
import { LeetCode, fetcher } from "leetcode-query";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

// setup browser
const _browser = chromium.use(stealth()).launch();
const _page = _browser
    .then((browser) => browser.newPage())
    .then(async (page) => {
        await page.goto("https://leetcode.com");
        return page;
    });

// use a custom fetcher
fetcher.set(async (...args) => {
    const page = await _page;

    const res = await page.evaluate(async (args) => {
        const res = await fetch(...args);
        return {
            body: await res.text(),
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers),
        };
    }, args);

    return new Response(res.body, res);
});

// use as normal
const lc = new LeetCode();
const daily = await lc.daily();
console.log(daily);
await _browser.then((browser) => browser.close());
```

## Documentation

Documentation for this package is available on <https://jacoblincool.github.io/LeetCode-Query/>.

## Links

- NPM Package: <https://www.npmjs.com/package/leetcode-query>
- GitHub Repository: <https://github.com/JacobLinCool/LeetCode-Query/>
