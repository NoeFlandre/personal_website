---
title: "Can LLMs learn conceptual modeling from slide decks?"
description: "Our new study asks if LLMs can learn enough conceptual modeling to pass graduate quizzes by using the same course materials as students."
pubDatetime: 2024-10-26T12:00:00Z
tags: ["LLM", "Research", "Conceptual Modeling", "Education"]
featured: true
readingTime: "4 min read"
---

Our latest publication just dropped and it's time for a little blog post about it. 

Source paper : [https://link.springer.com/chapter/10.1007/978-3-031-75599-6_15](https://link.springer.com/chapter/10.1007/978-3-031-75599-6_15)

Our new study asks a clean question: **if you give an LLM the same course materials as students (readings + slide decks), can it learn enough conceptual modeling to pass the same graduate quizzes?**

## Setup

We took a a graduate conceptual modeling course from Fall 2023 for which the passing grade was of **70%**. The assessment was made on mostly **open-ended** questions (ill-structured problems; multiple valid solutions; emphasis on reasoning and construction). The set was totalling **5 quizzes** spanning **28 questions**. The coverage of our assessment includes modeling goals, disease models and their validity, Agent Based Models (ABMs), language models, design of experiments. Our questions span multiple mastery levels (understand → create). We leverage two models which were the state of the art : **GPT-4o** and **Claude 3.5 Sonnet**. Both models were tested **with vs. without** access to course resources. What we mean by “training” is not fine-tuning: it’s conditioning on the teaching material (slides provided as images; some merged due to input limits). We ensured control via identical quiz prompts for students and LLMs; instructor graded both.

## Our results 

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

## Why we think this is interesting

Conceptual modeling is not a multiple-choice domain. It’s *construction + critique* under ambiguity. Our study intentionally uses open-ended, ill-structured questions, so “passing” actually means something: the model must synthesize, justify, and design.

Also: the medium is realistic. If teaching happens in slide decks (text + diagrams), then **vision-capable LLMs can plausibly “take the course”** rather than relying purely on pretraining priors.

## Caveats to consider 

- What drives the gain: reading slide text vs. understanding diagrams? Needs ablations.
- Generality: the result is anchored to this course’s style (simulation-oriented conceptual modeling).
- The headline depends on the passing bar (70% here).
