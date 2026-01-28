---
title: "Can LLMs learn conceptual modeling from slide decks?"
description: "Our new study asks if LLMs can learn enough conceptual modeling to pass graduate quizzes by using the same course materials as students."
pubDatetime: 2024-10-26T12:00:00Z
tags: ["LLM", "Research", "Conceptual Modeling", "Education"]
featured: true
readingTime: "4 min read"
---

New publication!

Source paper : [https://link.springer.com/chapter/10.1007/978-3-031-75599-6_15](https://link.springer.com/chapter/10.1007/978-3-031-75599-6_15)

Our new study asks a clean question: **if you give an LLM the same course materials as students (readings + slide decks), can it learn enough conceptual modeling to pass the same graduate quizzes?**

## Setup

- Context: a graduate conceptual modeling course (Fall 2023). Passing threshold: **70%**.
- Assessment: **5 quizzes**, **28 questions**, mostly **open-ended** (ill-structured problems; multiple valid solutions; emphasis on reasoning and construction).
- Coverage: modeling goals/compartmental+CA, disease models+validity, Agent Based Models (ABMs), language models, design of experiments; questions span multiple mastery levels (understand → create).
- Models: **GPT-4o** and **Claude 3.5 Sonnet**, each tested **with vs. without** access to course resources.
- “Training” is not fine-tuning: it’s conditioning on the teaching material (slides provided as images; some merged due to input limits).
- Control: identical quiz prompts for students and LLMs; instructor graded both.

## Results (numbers that matter)

**1) Course materials matter.** Full-marks rate jumps when the models get the slides/readings:
- Claude: **28.57% → 57.14%**
- GPT-4o: **39.28% → 82.14%**
- Students: **62.03%** (reference)

**2) Passing is model-dependent.**
With materials, **both pass**, but the gap is large: Claude is “barely passing”, while **GPT-4o is often at/above the median student**.

**3) Performance is stable across topics and mastery levels.**
Across quiz themes and mastery levels, we report consistent performance; ANOVA suggests no significant differences across mastery levels (p > 0.05).

**4) Learning makes answers shorter (and more specific).**
Average response length drops from **2368.67 ± 1040.39** chars to **1716.53 ± 1122.12** chars after exposure to the materials, less hedging, more course-specific precision.

## Why this is interesting

Conceptual modeling is not a multiple-choice domain. It’s *construction + critique* under ambiguity. Our study intentionally uses open-ended, ill-structured questions, so “passing” actually means something: the model must synthesize, justify, and design.

Also: the medium is realistic. If teaching happens in slide decks (text + diagrams), then **vision-capable LLMs can plausibly “take the course”** rather than relying purely on pretraining priors.

## Caveats (distilled)

- What drives the gain: reading slide text vs. understanding diagrams? Needs ablations.
- Generality: the result is anchored to this course’s style (simulation-oriented conceptual modeling).
- The headline depends on the passing bar (70% here).
