# LeetCode API

## Examples

### Get A User's Public Profile

```typescript
import { LeetCode } from "leetcode-api";

const leetcode = new LeetCode();
const user = await leetcode.get_user("username");
```

### Get All Of Your Submissions

```typescript
import { LeetCode, Credential } from "leetcode-api";

const credential = new Credential();
await credential.init("YOUR-LEETCODE-SESSION-COOKIE");

const leetcode = new LeetCode(credential);
console.log((await leetcode.get_submissions(100, 0)));
```
