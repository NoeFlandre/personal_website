---
title: "Can we turn agent-based models into empathetic stories (without getting poetic)?"
description: "We test whether GPT-4 can translate agents’ simulated lives into readable, empathetic narratives—and show that style transfer beats ‘please be empathetic’ prompts."
pubDatetime: 2025-09-03T12:00:00Z
tags: ["LLM", "Research", "Agent-Based Modeling", "Narratives", "Empathy"]
featured: true
readingTime: "5 min read"
---

Our new publication just came out! Let's break it down

Source paper : [https://doi.org/10.1080/17477778.2025.2536663](https://doi.org/10.1080/17477778.2025.2536663)

Instead of asking “can ABMs predict?”, we ask something more human:

**Can an LLM help decision-makers *feel* what simulated agents go through, by turning ABM traces into first-person stories, while staying faithful to the underlying dynamics?**

## The idea in one line

ABMs are great at structure (counts, curves, trends).  
Stories are great at attention and care.  
So we try to **keep the ABM for structure** and use the LLM for **narrative bandwidth**, without drifting into syrupy “LLM empathy” prose.

## What we did

### 1) The models (3 case studies)

- **Case studies (3 ABMs):** two evacuation models (fire/flood; hurricane) + one migration model.

### 2) The pipeline (from traces → story)

- **Pipeline:** simulation outputs (time series per agent) → “journey” summary → GPT-4 as *narrativizer* producing a story.

### 3) The two ways we prompted empathy

We compared two prompting strategies:

- **Direct:** explicitly ask for *empathetic* narratives (and accept GPT’s interpretation of empathy).
- **Indirect:** **style transfer**, write in the voice of well-known empathetic figures.

## What we measured (and why)

We didn’t just eyeball the stories, we measured **readability** (Flesch Reading Ease), **quality + faithfulness** (does the story reflect initial/final states and trends), **human perception of empathy** via validated questionnaires (pilot user study).

## Results

### 1) Indirect > direct for readable writing

In a factorial design (**144 runs**), readability ranges from “fairly easy” to “very easy” depending on settings.

The biggest lever is **indirect prompting (style transfer)**:

- **MigrAgent:** best **61.54 → 83.36**
- **CHIME:** **76.87 → 86.71**
- **BNE:** **75.78 → 93.54**

In plain terms: **shorter sentences + simpler words**, without explicitly pleading for empathy.

### 2) Faithfulness improves (at least on the checks we ran)

With the indirect setup, **every story had a human name**, and the text reflected **initial/final/trends** for the agent across all stories, an improvement over the direct approach’s already-high rates.

### 3) People believe the “genuine emotions” signal, but don’t fully *feel it*

Pilot survey: **6 participants** (balanced gender; avg age **42**; all graduate/professional degrees).

On the **State Empathy Scale (1–5)**:

- “**The character’s emotions are genuine**”: **4.17 / 3.67 / 3.50** (MigrAgent / CHIME / BNE)
- “**Reactions are understandable**”: **4.33 / 4.33 / 3.83**
- But “**I experienced the same emotions**” is lower (**3.50 / 2.50 / 2.17**).

We argue this gap is expected: the scenarios are extreme (evacuations, disasters), and readers aren’t in that physiological state which makes it harder to empathize.

There’s also evidence outcomes vary by model (one-way ANOVA **p = 0.0349**).

## Why this matters

ABMs usually talk in aggregates: curves, counts, means. That’s great for prediction. Bad for *care*.

Our paper shows a pragmatic path:
- **keep the ABM for structure**
- **use the LLM for narrative bandwidth**
- and use **style transfer** as the control knob to avoid syrupy “LLM empathy” prose.

## Some limitations

- **Tiny human study** (n=6), intentionally closer to expert audiences, not the general public.
- Readability ≠ empathy; and empathy ≠ good policy (can bias attention). Our paper focuses on single-group scenarios to reduce that risk.
