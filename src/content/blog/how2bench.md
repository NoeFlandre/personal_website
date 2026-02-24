---
title: "How2Bench: A Guideline for Benchmark Development"
description: "A breakdown of the How2Bench paper, which advocates rigor in benchmark development, with a focus on evaluation reliability and reproducibility."
pubDatetime: 2026-02-24T19:40:06+05:30
heroImage: /assets/img/2026/building_a_benchmark/image.png
tags: ["Paper Review"]
featured: false
---

This blog post is a breakdown of the following paper: 
[https://arxiv.org/pdf/2501.10711](https://arxiv.org/pdf/2501.10711)

I highly recommend reading it even though this blog post is meant to capture the gist of it. 

# What is this paper about

There is a growing awareness regarding code benchmark quality. However, after a decade-long survey, the analysis of these benchmarks reveals a gap between this awareness and actual practices. In 2025 alone, the number of benchmarks that ignored code coverage in their testing was almost equal to the total number of such benchmarks created across the entire previous ten years combined (2014–2024). The authors of this paper therefore advocate for rigor while building benchmarks, focusing on evaluation reliability and reproducibility. To formalize this position, they propose How2Bench, a guideline including 55 checklist items for benchmark development.

This paper gives a good overview of current code benchmarks, as well as providing a methodology for grounding new benchmarks in best practices. Although it targets benchmarks for evaluating LLM coding capabilities, many of its recommendations can surely be transferred to other types of benchmarks. 

# What the empirical evidence reveals about current code benchmarks

The main concerns are:

- No quality assurance (e.g. no human verification)
- Data contamination (e.g. testing LLMs on data seen during training)
- No deduplication of data points (e.g. not removing duplicate samples in the benchmark)
- No reliable judgment (e.g. test coverage not considered)
- No repeated runs while evaluating (LLM outputs are stochastic; therefore, not repeating experiments can be misleading ==> randomness)
- Lack of information for reproducibility (e.g. prompts, hyperparameters)
- No logging (e.g. outputs, errors, configurations...)
- Lack of open-sourcing (e.g. evaluation scripts, code, data not released)

Some of these issues are exceptions rather than the norm (e.g. open-sourcing, which only lacks in 12.4% of the studied cases), but they are worth reporting as best practices.

They also note that while the absolute number of flawed benchmarks has risen, the overall proportion of benchmarks focusing on data quality has also increased. They also acknowledge an increasing focus on real-world problems, stronger awareness of manual quality assurance, a larger and more diverse set of LLMs being assessed, and finally a growing trend in publicly released artifacts, prompts, and resources. 

In a human study, they also note that many flawed benchmarks stem from the significant effort required to build a benchmark with rigor and reliability, as well as a lack of awareness regarding best practices. Some participants also raised challenges regarding practical constraints while developing benchmarks (e.g. cost, time, human resources).

# The Lifecycle of Benchmark Development

The benchmark lifecycle usually goes through 5 phases: design, construction, evaluation, analysis, and release. 

During design time, we identify the motivation, the scope, and the capabilities within the scope we want to study. This is also the time when we look for related work and understand whether benchmarks already exist on our topic and, if so, what their limitations are.

While building the benchmark, we usually go through data collection (e.g. GitHub, LeetCode, StackOverflow). Then follows preprocessing (filtering, cleaning, deduplication, denoising), curation, and validation. 

Once built, the benchmark is used to evaluate LLMs and therefore serves as a validation of whether it is effectively capturing the capabilities we were aiming for or not. This is also the time when it is important to select a diverse set of candidates for assessment, tweak and freeze the configuration settings, as well as log the experiments to ensure reproducibility.

Once the assessment phase is done, analysis allows us to draw conclusions regarding the abilities of the tested candidates. LLM performance is compared and displayed in visual artifacts for better understanding. This phase helps understand shortcomings, correlations, and areas for improvement, and paves the way for future efforts.

Finally, the release phase aims at open-sourcing the benchmark by preparing the relevant material (e.g. documentation, logged experiments). This phase is essential for transparency and reproducibility.

# The guidelines and statistics outlined by the paper

The detailed checklists can be found in the supplementary material of the paper. To stay concise, I am only focusing on an overview of their guidelines and statistics. 

## 1) Benchmark design

While designing a benchmark, one should assess whether they are trying to close a significant research gap or not. The scope should be defined, and the capabilities should be detailed in order to understand to which practical applications they refer. Code-wise, the authors note significant interest in code generation, code reasoning, program repair, and defect detection, with a rapid increase in benchmarks covering these areas over the past two years. A high bias towards Python, Java, and C++ is to be noted, with an increasing trend for C/C++, JavaScript, and Rust benchmarks between 2024 and 2025.

## 2) Construction

While sourcing data, traceability and source quality should be addressed rigorously. This also includes tackling data contamination, data representativeness, data relevance to the targeted scope, diverse and sufficient coverage of the studied capabilities, and so on. The authors also argue in favor of manual reviewing, careful design of metrics, as well as additional considerations such as safety or removal of sensitive information. The survey highlights a high rate of non-deduplication and data contamination. Many benchmarks do not consider test coverage. However, an increasing trend in manual quality checks is noted, even though overall quality assurance remains low.  

## 3) Evaluation

The authors stress the importance of covering a sufficiently representative portion of LLM options (closed/open-source, different configurations, architectures...). They also argue for the importance of repeating experiments due to the non-deterministic nature of LLMs, to mitigate conclusions being drawn on results affected by randomness. This randomness in the outputs is furthermore driven by other factors such as prompting, which can account for up to 40% of performance variability; hardware, software, and platform environments.

 The researchers also advocate for transparency and reproducibility at the assessment phase, which can be supported by documented logs. Through their surveys, the authors found an increasing proportion of benchmarks assessing a broader range of LLMs. The most evaluated models come from the GPT family, leading by far in percentage, followed by Deepseek and Qwen. A large array of benchmarks do not validate whether their prompting strategies are well designed or not, while only a third of the benchmarks decided to repeat their experiments. Regarding transparency and reproducibility, the authors acknowledge a bleak situation where very few evaluations provide their environment, reproducible instructions, and hyperparameters.

## 4) Analysis

While analyzing results, authors argue that the focus should be on determining whether the benchmark is difficult (challenging for LLMs), stable (whether repeated experiments lead to consistent outcomes), differentiable (separating the strengths from the weaknesses in assessed models), and whether strong performance on simpler/foundational coding tasks predicts strong performance on more complex real-world tasks. The presentation of the results should be clear and understandable, and providing a basis for future enhancements is encouraged. Their survey shows that data presentation, analysis, and clarity are receiving less interest.

## 5) Release

While releasing our benchmarks, we should choose a license, thoroughly remove sensitive and harmful content (e.g. API keys, personal emails...), and openly share materials. Detailing the experimental setup is strongly advised, along with manuals and interfaces to ensure engagement reliability and high impact value for the community. The survey highlights that a striking proportion of benchmarks is only partially open and about 12% are closed source. Prompts are not disclosed in about 39% of cases, while roughly 19% do not set up licenses and 17% make their logs accessible. These numbers should be balanced with a noticeable trend in substantially open-sourced benchmarks over the past year.