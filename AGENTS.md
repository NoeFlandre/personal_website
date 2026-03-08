# AGENTS.md

Operating instructions for coding agents.

## Core Principle
- Deliver working, verified, minimal, maintainable changes. Optimize for correctness, clarity, and reviewability.

## Non-Negotiables
- Never assume generated code works. If it was not executed, it is unverified.
- Run existing tests first. Understand the baseline before editing.
- Prefer red/green TDD: write or update a failing test, confirm it fails, implement the smallest fix, confirm it passes.
- Keep changes minimal and reviewable. Avoid speculative abstraction; respect YAGNI.
- Do not hand off unreviewed code. Before handoff, verify behavior, review your diff, and make sure the description matches reality.
- Stop and ask one concise question when ambiguity is material.
- Never create or propose a new blog post without explicit user consent.
- Prefer `gsed` over `sed` for sed-style shell operations in this repo.
- Never downgrade dependencies to solve issues; use tooling to check current versions and upgrade to the latest compatible stable versions.
- Do not run `npm run dev` in agent mode; use `npm run build` unless the user explicitly asks for preview behavior.

## Operating Loop
1. Understand the goal, constraints, relevant files, tests, and verification path.
2. Inspect implementation, tests, config, docs, and nearby patterns.
3. Baseline by running tests and, when relevant, the app.
4. Test first. If automation is not feasible, define a manual test procedure.
5. Implement the smallest sufficient change.
6. Execute and verify after each change.
7. Document what changed, why, how it was verified, and any tradeoffs.
8. Reduce cognitive debt with walkthroughs, notes, or small explainers when needed.

## Testing Policy
- Automated tests are part of implementation.
- Use the narrowest test that proves the behavior.
- Convert discovered bugs into regression tests.
- Keep browser tests for critical UI flows when they exist.
- For this project, prefer `npm run build` as the primary verification command.
- Manual testing still matters:
  - Libraries/functions: exercise directly with scripts or one-off commands.
  - APIs: run the server, use `curl`, verify happy/error paths, status codes, and payloads.
  - Web UIs: use browser automation when available, verify layout, interactions, state changes, errors, and accessibility.
  - Inspect screenshots when available.
- Show your work: record commands run, outputs observed, screenshots inspected, and conclusions.

## Evidence and Documentation
- Leave evidence, not claims: transcripts, sample outputs, screenshots, and demo docs.
- Prefer executable demo notes in `notes/` for nontrivial work. Never fabricate results.
- Run `--help` before using unfamiliar CLI tools.
- For subtle or complex behavior, add walkthroughs, visualizers, or interactive explainers.
- Preserve useful scripts, demos, examples, and notes for reuse.

## Collaboration
- Reviewer time is precious; do your own validation first.
- PR descriptions must be truthful about goal, scope, testing, tradeoffs, and links to demos/issues.
- Split work into small commits and PRs whenever practical.

## Defaults for Small Tools
- Prefer one self-contained HTML file with vanilla JS and minimal CSS unless more is clearly needed.
- Make small demos mobile-usable with clear headings, readable typography, and direct manipulation where useful.

## Project Notes
- Key paths: `src/content/blog/`, `src/pages/`, `src/components/`, `src/layouts/`, `src/styles/`, `src/consts.ts`.
- Broken blog images usually belong under `public/assets/img/`; source files may exist in `/temp-repos/noeflandre.com/assets/img/`.
- For dependency work, use tooling such as `npm outdated` and `npm view <package> version` instead of guessing versions.

## Writing Policy
- Do not ghostwrite personal opinion in someone else's voice unless asked.
- Improve documentation, notes, and mechanical text.
- Proofread for typos, grammar, logic, factual errors, weak arguments, and broken links.

## Definition of Done
- Right files changed; change is minimal but sufficient.
- Tests added or updated and passing when applicable.
- Behavior manually exercised and edge cases checked when applicable.
- Docs/comments updated if behavior changed.
- Implementation is understandable.
- Evidence exists for what was tested and what happened.

## New Blog Post Workflow
- If the user says `new blog post` without a topic/title, ask for it first.
- Pick a short branch slug from the topic/title.
- Scaffold `src/content/blog/<year>/<slug>.md`.
- Frontmatter should only set `title` from the user, plus minimal placeholders: `description: "TBD"`, `draft: true`, `pubDatetime: <today>`.
- Do not add body content or invent an outline.
- Open the new file with `code <new-post-path>`.

## Compact Policy
> Build the smallest correct change. Run tests first. Prefer red/green TDD. Never assume code works without executing it. Manually test as appropriate, convert bugs into automated tests, keep changes simple and reviewable, document with evidence, and create walkthroughs or explainers when the work is hard to understand.
