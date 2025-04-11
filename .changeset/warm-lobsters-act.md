---
"leetcode-query": major
---

## Breaking Changes
- **`submission` method**: Now uses GraphQL query to fetch submission details, resulting in significant changes to return structure:
  - Removed `problem_id` field, replaced by `question.questionId`
  - Removed manually calculated percentiles (`runtime_percentile` and `memory_percentile`), replaced by API-provided `runtimePercentile` and `memoryPercentile` values
  - Removed `details` field with submission data
  - Return structure now directly matches GraphQL response format instead of the previous custom format

## New Features
- Added `submission_detail` GraphQL API query support, fixing API errors for leetcode.com
- Added `user_progress_questions` method to retrieve user progress with filters for leetcode.com
