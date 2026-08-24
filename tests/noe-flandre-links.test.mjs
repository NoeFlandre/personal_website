import assert from "node:assert/strict";
import test from "node:test";

import { CAREER_TIMELINE_PUBLICATIONS } from "../src/features/about/data/careerTimelineData.ts";

const NOE_SCHOLAR_HREF = "https://scholar.google.com/citations?user=NOvshPMAAAAJ&amp;hl=en";
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("all publication links for Noé Flandre use his Google Scholar profile", () => {
  for (const publication of CAREER_TIMELINE_PUBLICATIONS) {
    const description = publication.description ?? "";

    assert.match(
      description,
      new RegExp(`href="${escapeRegExp(NOE_SCHOLAR_HREF)}"[^>]*>Noe Y\\. Flandre</a>`)
    );
    assert.doesNotMatch(
      description,
      /href="https:\/\/arxiv\.org\/search\/cs\?searchtype=author&amp;query=Flandre,\+N\+Y"/
    );
  }
});
