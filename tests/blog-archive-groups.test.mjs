import assert from "node:assert/strict";
import test from "node:test";

import { countArchivePosts, MONTH_NAMES } from "../src/features/blog/utils/archivePresentation.ts";
import { getArchiveGroups } from "../src/features/blog/utils/getArchiveGroups.ts";

function createPost({
  id,
  pubDatetime = "2025-01-01T00:00:00.000Z",
  modDatetime,
  draft = false,
  unlisted = false,
} = {}) {
  return {
    id,
    filePath: `src/content/blog/${id}.md`,
    data: {
      title: id,
      description: `${id} description`,
      author: "Noe",
      pubDatetime,
      modDatetime,
      draft,
      unlisted,
      tags: ["Post"],
    },
  };
}

test("getArchiveGroups excludes hidden posts and orders years, months, and posts descending", () => {
  const groups = getArchiveGroups([
    createPost({ id: "jan-older", pubDatetime: "2025-01-01T00:00:00.000Z" }),
    createPost({ id: "jan-newer", pubDatetime: "2025-01-20T00:00:00.000Z" }),
    createPost({ id: "feb", pubDatetime: "2025-02-10T00:00:00.000Z" }),
    createPost({ id: "prev-year", pubDatetime: "2024-12-10T00:00:00.000Z" }),
    createPost({ id: "draft", pubDatetime: "2025-03-10T00:00:00.000Z", draft: true }),
    createPost({ id: "unlisted", pubDatetime: "2025-03-12T00:00:00.000Z", unlisted: true }),
  ]);

  assert.deepEqual(
    groups.map((group) => ({
      year: group.year,
      months: group.months.map((month) => ({
        month: month.month,
        posts: month.posts.map((post) => post.id),
      })),
    })),
    [
      {
        year: 2025,
        months: [
          { month: 2, posts: ["feb"] },
          { month: 1, posts: ["jan-newer", "jan-older"] },
        ],
      },
      {
        year: 2024,
        months: [{ month: 12, posts: ["prev-year"] }],
      },
    ]
  );
});

test("getArchiveGroups orders months by publication month despite modification dates", () => {
  const groups = getArchiveGroups([
    createPost({
      id: "february-post",
      pubDatetime: "2025-02-10T00:00:00.000Z",
      modDatetime: "2025-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "january-post",
      pubDatetime: "2025-01-10T00:00:00.000Z",
      modDatetime: "2025-02-01T00:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    groups[0].months.map((monthGroup) => monthGroup.month),
    [2, 1]
  );
});

test("archive presentation helpers keep month labels and year counts centralized", () => {
  assert.deepEqual(MONTH_NAMES, [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]);
  assert.equal(
    countArchivePosts([
      { month: 1, posts: [{ id: "a" }, { id: "b" }] },
      { month: 2, posts: [{ id: "c" }] },
    ]),
    3
  );
});
