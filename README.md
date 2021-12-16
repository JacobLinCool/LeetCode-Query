# LeetCode Query

Get user profiles, submissions, and problems on LeetCode.

## Features

### Without Authentication

- [x] Get Public User Profile.
- [x] Get User's Recent Submissions. (Public, Max: 20)
- [ ] Get All Problem List.
- [x] Get Problem Detail.

### Authenticated

- [x] Get All Submissions of The Authenticated User.

## Examples

### Get An User's Public Profile

Includes recent submissions and posts.

```typescript
import { LeetCode } from "leetcode-query";

const leetcode = new LeetCode();
const user = await leetcode.get_user("username");
```

### Get All Of Your Submissions

```typescript
import { LeetCode, Credential } from "leetcode-query";

const credential = new Credential();
await credential.init("YOUR-LEETCODE-SESSION-COOKIE");

const leetcode = new LeetCode(credential);
console.log((await leetcode.get_submissions(100, 0)));
```

## Documentation

Documentation for this package is available on <https://jacoblincool.github.io/LeetCode-Query/>.

## Links

- NPM Package: <https://www.npmjs.com/package/leetcode-query>
- GitHub Repository: <https://github.com/JacobLinCool/LeetCode-Query/>
