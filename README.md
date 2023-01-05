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
console.log((await leetcode.submissions(100, 0)));
```

## Documentation

Documentation for this package is available on <https://jacoblincool.github.io/LeetCode-Query/>.

## Links

- NPM Package: <https://www.npmjs.com/package/leetcode-query>
- GitHub Repository: <https://github.com/JacobLinCool/LeetCode-Query/>
