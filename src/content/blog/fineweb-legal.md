---
title: "Building FineWeb-Legal: A 10B Token Pilot"
description: "How I extracted 67 million words of legal text from 10B tokens of web data using heuristics and classifiers."
pubDatetime: 2026-01-03T12:00:00+01:00
heroImage: /fineweb-legal.png
tags: ["Project"]
featured: true
---

I've been wanting to work on legal AI for a while. The problem is data. The good material (case law, statutes, court filings) lives behind expensive paywalls. Westlaw and LexisNexis aren't exactly giving away access.

So I built something myself.

**The idea**

FineWeb is this massive dataset of web crawl data that HuggingFace released. It's already cleaned up and ready to use. I thought there might probably be some legal content in this dataset. Court opinions get published online. Government sites post regulations. Law schools put up research papers.

Someone just has to filter that data. They already did something similar with FinewebEdu which is focusing on educational content. So the dataset is already here, their method is publicly released, we just have to tailor it to a different domain : legal in this case.

**What I built**

1. A heuristic filter to find candidate legal documents (looking for keywords like "plaintiff", "statute", citation patterns like "U.S.C." or "F.3d")
2. A classifier trained on 6,500 samples I annotated with Mistral API
3. A pipeline to score millions of documents

The classifier ended up at 97.99% F1, which is better than I expected. It's a LoRA adapter on Gemma-Embedding-300M, so it's small and fast. I am renting some GPUs for few experiments but I don't have infinite budget so I try to keep things at tiny scale most of the time. 

**The result**

52,132 documents. 66.9 million words. Mostly case law from sites like openjurist.org and findacase.com, plus federal register filings and some academic content.

I split it into three tiers:
- **default**: everything with a score ≥ 3 (52k docs)
- **high_quality**: score ≥ 4 (32k docs, the good stuff)
- **supreme**: score ≥ 4.8 (16k docs, the very good stuff)

**What's next**

This is just the 10-billion token sample. The full FineWeb corpus is 18.5T. Scaling up the pipeline is the next step (though it might be expensive GPU wise).

If you want to use the classifier :
```
https://huggingface.co/datasets/NoeFlandre/fineweb-legal-pilot
```

If you want to use the dataset :
```
https://github.com/NoeFlandre/fineweb-legal
```

---

*3rd January 2026*

Happy New Year!
