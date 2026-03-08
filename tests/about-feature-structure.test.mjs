import test from "node:test";
import assert from "node:assert/strict";

import { ABOUT_MAP_PLACES } from "../src/features/about/data/aboutMapPlaces.ts";
import {
  CAREER_TIMELINE_AWARDS,
  CAREER_TIMELINE_EDUCATION,
  CAREER_TIMELINE_EXPERIENCE,
  CAREER_TIMELINE_HUMANITARIAN_IMPACT,
  CAREER_TIMELINE_PROJECTS,
  CAREER_TIMELINE_PUBLICATIONS,
} from "../src/features/about/data/careerTimelineData.ts";
import { parsePlacesDataset, sortPlacesForUi } from "../src/features/about/utils/aboutMap.js";

test("about feature files are available from the feature-local structure", () => {
  assert.ok(Array.isArray(ABOUT_MAP_PLACES));
  assert.ok(ABOUT_MAP_PLACES.length > 0);
  assert.equal(typeof sortPlacesForUi, "function");
  assert.equal(typeof parsePlacesDataset, "function");
  assert.ok(CAREER_TIMELINE_PUBLICATIONS.length > 0);
  assert.ok(CAREER_TIMELINE_EXPERIENCE.length > 0);
  assert.ok(CAREER_TIMELINE_EDUCATION.length > 0);
  assert.ok(CAREER_TIMELINE_PROJECTS.length > 0);
  assert.ok(CAREER_TIMELINE_AWARDS.length > 0);
  assert.ok(CAREER_TIMELINE_HUMANITARIAN_IMPACT.length > 0);
});
