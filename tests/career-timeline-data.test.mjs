import test from "node:test";
import assert from "node:assert/strict";

import {
  CAREER_TIMELINE_AWARDS,
  CAREER_TIMELINE_EDUCATION,
  CAREER_TIMELINE_EXPERIENCE,
  CAREER_TIMELINE_HUMANITARIAN_IMPACT,
  CAREER_TIMELINE_PROJECTS,
  CAREER_TIMELINE_PUBLICATIONS,
} from "../src/features/about/data/careerTimelineData.ts";

test("career timeline data exports all expected sections", () => {
  assert.ok(CAREER_TIMELINE_EXPERIENCE.length > 0);
  assert.ok(CAREER_TIMELINE_EDUCATION.length > 0);
  assert.ok(CAREER_TIMELINE_PROJECTS.length > 0);
  assert.ok(CAREER_TIMELINE_AWARDS.length > 0);
  assert.ok(CAREER_TIMELINE_HUMANITARIAN_IMPACT.length > 0);
  assert.ok(CAREER_TIMELINE_PUBLICATIONS.length > 0);
});

test("career timeline entries include titles and years", () => {
  const sections = [
    CAREER_TIMELINE_EXPERIENCE,
    CAREER_TIMELINE_EDUCATION,
    CAREER_TIMELINE_PROJECTS,
    CAREER_TIMELINE_AWARDS,
    CAREER_TIMELINE_HUMANITARIAN_IMPACT,
    CAREER_TIMELINE_PUBLICATIONS,
  ];

  for (const section of sections) {
    for (const item of section) {
      assert.equal(typeof item.title, "string");
      assert.notEqual(item.title.length, 0);
      assert.equal(typeof item.year, "string");
      assert.notEqual(item.year.length, 0);
    }
  }
});
