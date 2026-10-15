import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const postPath = new URL(
  "../src/content/blog/2026/looking-for-my-next-career-opportunity.md",
  import.meta.url
);
const heroPath = new URL(
  "../public/assets/img/2026/next-career-opportunity/fatehpur-sikri.jpeg",
  import.meta.url
);

const expectedBody = `I am currently an AI Research Engineer at INRIA. My work focuses on linking text with geographic footprints (e.g polygons). The project I am involved in targets text describing any features having a remote sensing signature (e.g landuse).

The higher goal is to train a foundation model providing a richer representation of a given place on Earth by combining both remote sensing imagery and text. These modalities are complementary and provide useful information that could not be captured solely by using one or the other.

Prior to this role I have been publishing on LLMs application to different domains like conceptual modeling, education or simulation, alongside other papers on agentic AI workflows.

My contract at INRIA will be ending at the beginning of 2027, and I am starting to look for my next opportunity. I would love to pursue a PhD in AI even though I am open to other roles too (e.g Research Engineer…). I am curious and I love learning new things so the topic / domain application isn’t a hard constraint to me.

Feel free to reach out :)

Resume: [noe-flandre-cv](https://noeflandre.com/assets/docs/noe-flandre-cv.pdf)`;

test("career opportunity post preserves the supplied copy, date, and image metadata", () => {
  assert.equal(existsSync(postPath), true);
  assert.equal(existsSync(heroPath), true);

  const { data, content } = matter(readFileSync(postPath, "utf8"));
  assert.equal(data.title, "I am looking for my next career opportunity!");
  assert.equal(
    data.description,
    "My contract at INRIA will be ending at the beginning of 2027, and I am starting to look for my next opportunity."
  );
  assert.equal(data.pubDatetime.toISOString(), "2026-10-15T07:00:00.000Z");
  assert.equal(data.draft, false);
  assert.equal(data.unlisted, false);
  assert.equal(data.heroImage, "/assets/img/2026/next-career-opportunity/fatehpur-sikri.jpeg");
  assert.equal(
    data.heroImageAlt,
    "A person in a dark jacket stands among red stone arches and geometric patterned panels."
  );
  assert.equal(data.heroImageCaption, "Fatehpur Sikri, January 2026.");
  assert.equal(content.trim(), expectedBody);

  const hero = readFileSync(heroPath);
  assert.equal(
    createHash("sha256").update(hero).digest("hex"),
    "010266813ea351a892c157e4d7fc16d313f61b1e13938d987a4057cba3101e23"
  );
});
