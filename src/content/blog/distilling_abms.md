---
title: "Distilling Agent-Based Models into Textual Explanations via LLMs"
description: "A look at our new research on using LLMs to turn complex ABM simulations into clear textual explanations."
pubDatetime: 2026-04-15T20:23:06+05:30
heroImage: /distilling_abms.png
tags:
  - Research
  - LLMs
  - ABMs
featured: true
---

Agent-based models (ABMs) are powerful tools to simulate a given behavior or phenomenon. The big picture of ABMs consists of a simulation where we define agents (the entities taking part in the simulation) and the rules defining their behaviors throughout this simulation. It comes with several parameters and can be applied to a wide range of domains. You could for example use ABMs to simulate the milk consumption behavior of a population as well as urban traffic while trying to plan a city infrastructure. These tools help decision makers to get a clearer and grounded idea of the phenomenon they are tackling. 

Outcomes of such simulations can be hard to explain to non-experts. In our new research, we study whether LLMs can turn complex ABMs simulations into clear textual explanations. This can be useful to decision makers to act faster on a critical situation as well as broadening the understanding of these simulations to a larger public (i.e non-experts). 

We introduce an automated simulation-to-text pipeline for ABMs implemented in NetLogo. It extracts model context, runs repeated simulations, turns outputs into plots and statistical summaries, and generates narrative reports with multimodal LLMs. We evaluate the pipeline across 3 peer-reviewed ABMs and 4 recent multimodal LLMs, using a [design-of-experiments approach](https://noeflandre.com/posts/design-of-experiments) to identify what actually drives report quality. The LLMs we considered are Gemini 3.1 Pro, Qwen 3.5, Kimi K2.5 and Claude Opus 4.6. Because generating such reports involve several inference calls to LLMs we therefore chose to use summarization algorithms to keep the resulting report concise enough. Four summarization algorithms were kept and picked from two different categories: 

- Abstractive summarizers (BART, T5)
- Extractive summarizers (BERT, LongFormer)

While the first category may rephrase content to give a better understanding to the reader and therefore introduce hallucinations, the latter only extracts parts of the content, keeping the summary faithful but harder to read and sometimes incomplete. 

Our main finding is that the report quality is driven mostly by the summarization algorithm and its interaction with the LLM. In our experiments it could account for up to 34% of the variance. In practice, abstractive summarizers like BART and T5 produced more coherent and readable reports, while Claude Opus 4.6 was the most robust LLM in our experiments.

This work aims at making simulations more interpretable, accessible, and useful for subject-matter experts.  We believe better communication can strengthen trust in simulation-based decision support.

Paper: “Distilling the Complexity of Agent-Based Simulations Into Textual Explanations via Large Language Models”. 
Published in Big Data and Cognitive Computing.
Link: https://www.mdpi.com/2504-2289/10/4/121

---

*15th April 2026*