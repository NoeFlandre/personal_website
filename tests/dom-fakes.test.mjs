import assert from "node:assert/strict";
import test from "node:test";
import { FakeDocument, FakeElement, TrackedEventTarget } from "./helpers/dom-fakes.mjs";

test("tracked event targets drop listeners when their abort signal fires", () => {
  const target = new TrackedEventTarget();
  const controller = new AbortController();

  target.addEventListener("click", () => {}, { signal: controller.signal });
  assert.equal(target.listenerCount("click"), 1);

  controller.abort();
  assert.equal(target.listenerCount("click"), 0);
});

test("fake elements move children between parents and answer containment checks", () => {
  const parent = new FakeElement();
  const otherParent = new FakeElement();
  const child = new FakeElement();
  const sibling = new FakeElement();

  parent.appendChild(child);
  otherParent.appendChild(child);
  assert.equal(parent.children.length, 0);
  assert.equal(child.parentNode, otherParent);

  otherParent.insertBefore(sibling, child);
  assert.deepEqual(otherParent.children, [sibling, child]);
  assert.equal(otherParent.contains(sibling), true);
  assert.equal(otherParent.contains(parent), false);

  sibling.scrollIntoView({ block: "start" });
  assert.deepEqual(sibling.scrollIntoViewOptions, { block: "start" });

  sibling.setAttribute("hidden", "");
  assert.equal(sibling.hasAttribute("hidden"), true);
});

test("fake documents create elements and find elements by id under the body", () => {
  const documentRef = new FakeDocument();
  const created = documentRef.createElement("section");
  created.id = "about";
  documentRef.body.appendChild(created);

  assert.equal(created instanceof FakeElement, true);
  assert.equal(documentRef.getElementById("about"), created);
  assert.equal(documentRef.getElementById("missing"), null);
});
