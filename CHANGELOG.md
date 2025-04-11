# leetcode-query

## 2.0.0

### Major Changes

- [#105](https://github.com/JacobLinCool/LeetCode-Query/pull/105) [`2a777b1`](https://github.com/JacobLinCool/LeetCode-Query/commit/2a777b1759431d3cdadfa4021e98b9a04e9e15fd) Thanks [@jinzcdev](https://github.com/jinzcdev)! - ## Breaking Changes

  - **`submission` method**: Now uses GraphQL query to fetch submission details, resulting in significant changes to return structure:
    - Removed `problem_id` field, replaced by `question.questionId`
    - Removed manually calculated percentiles (`runtime_percentile` and `memory_percentile`), replaced by API-provided `runtimePercentile` and `memoryPercentile` values
    - Removed `details` field with submission data
    - Return structure now directly matches GraphQL response format instead of the previous custom format

  ## New Features

  - Added `submission_detail` GraphQL API query support, fixing API errors for leetcode.com
  - Added `user_progress_questions` method to retrieve user progress with filters for leetcode.com

## 1.3.0

### Minor Changes

- [#101](https://github.com/JacobLinCool/LeetCode-Query/pull/101) [`c9c774a`](https://github.com/JacobLinCool/LeetCode-Query/commit/c9c774a451d4b3d8421918cd74ae6116f28afec7) Thanks [@jinzcdev](https://github.com/jinzcdev)! - Add APIs for leetcode.cn endpoints

## 1.2.3

### Patch Changes

- [`cd8876b`](https://github.com/JacobLinCool/LeetCode-Query/commit/cd8876b0036ce36b7da8cf436b128e016b3ad0b4) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Disable response auto clone on receive-graphql hook

- [`cd8876b`](https://github.com/JacobLinCool/LeetCode-Query/commit/cd8876b0036ce36b7da8cf436b128e016b3ad0b4) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Allow user to select their own fetch implementation with [@fetch-impl](https://github.com/JacobLinCool/fetch-impl)

## 1.2.2

### Patch Changes

- [`bb47140`](https://github.com/JacobLinCool/LeetCode-Query/commit/bb47140ace98ba58da53e853d311fc8ab3f5b42c) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Works with no cookie presented in the response

## 1.2.1

### Patch Changes

- [`47ec5d4`](https://github.com/JacobLinCool/LeetCode-Query/commit/47ec5d425daafa15032ddb12b343dffc89fae0c2) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Fix fetcher shortcut

## 1.2.0

### Minor Changes

- [`9913aaf`](https://github.com/JacobLinCool/LeetCode-Query/commit/9913aafb01d74ce1b75e2406a6293fbb9014f835) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Allow library users to use their own fetch implementation

## 1.1.0

### Minor Changes

- [`c19d509`](https://github.com/JacobLinCool/LeetCode-Query/commit/c19d509bf33be7f26596aae855b9b4998fc2655f) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Support custom headers for GraphQL request

## 1.0.1

### Patch Changes

- [`a474021`](https://github.com/JacobLinCool/LeetCode-Query/commit/a474021dfc74aaf9352b98709d23a6ceb933cd63) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Check response status before returning GraphQL data

## 1.0.0

### Major Changes

- [#70](https://github.com/JacobLinCool/LeetCode-Query/pull/70) [`b28dd59`](https://github.com/JacobLinCool/LeetCode-Query/commit/b28dd595448835efd7286a3098b57e05f80cb856) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Remove dependency on node built-in module
