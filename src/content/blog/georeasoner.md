---
title: "One place, two views: the core idea behind GeoReasoner"
description: "A breakdown of the GeoReasoner paper, which leverages both linguistic and geospatial information to reason on geospatially grounded natural language."
pubDatetime: 2026-02-03T21:49:52+05:30
heroImage: /georeasoner.png
tags:
  - Wikipedia
  - Geospatial
  - LLM
  - OSM
featured: true
readingTime: "15 min read"
---

This blog post is a breakdown of the following paper:

```
https://arxiv.org/pdf/2408.11366
```

In geospatial reasoning, research has been employing two sets of methods :

1. conventional natural language understanding toolkits (e.g  Named Entity Recognition (NER) methods) which are used to identify and classify geographic entities
2. pretrained models on geo-related natural language data

Both these methods are facing limitations : 

1. They do not generalize well to unseen geospatial data
2. Existing approaches do not combine structured geospatial facts (e.g “longitude”) with unstructured linguistic descriptions (e.g cultural meaning of a location). The former can be found in geospatial databases (e.g OpenStreetMap) while the latter can be found online (e.g Wikipedia). 

To tackle these challenges this research team propose a new pretrained language model named GeoReasoner which they claim to be able to reason on geospatially grounded natural language. This is done by leveraging both linguistic and geospatial information.

They first use LLMs to generate location descriptions enriched with information from geographic databases along with information from the Internet. The goal is to build training data that lets the model learn :

1. how places are located in the world (the geospatial view)
2. how places are talked about in language, at the same time and for the same entities (the linguistic view)

---

**GEOSPATIAL DATA**

OpenStreetMap is giving coordinates, nearby places and so on. But Transformers expect text. Therefore the spatial information are being embedded into “fake sentences” called pseudo-sentences and geographic entities are ordered by neighboring distance. 

Here is an example : 
```
San Jose | Santa Clara | Sunnyvale | Mountain View
```

---

**LINGUISTIC DATA**

They are combining Wikipedia (rich descriptive text) and Wikidata (clean structured facts). They break pages at the sentence level and keep only the sentences mentioning the OSM place names to make sure that the model learns from text that is actually about that place. Their training samples are paragraphs with at least one geo-entity name. For wikidata they turn relation triples  to natural sentences. 

For instance : 
```
(San Jose, located_in, Silicon Valley) -> "San Jose is located in Silicon Valley."
```

For each place they now have a pair of representation : the geospatial one from OSM and the linguistic one from Wikipedia / Wikidata. This will help them using a contrastive loss later, in order to tell the model : “these two embeddings should be similar”. 

---

**LLM ASSISTED SUMMARIZATION**

Wikipedia text is noisy, geo databases are structured but not readable, the model which is going to learn from the data needs one coherent “story” per place. Therefore they are using an LLM as a compressor + integrator. The LLM is filtering the noise by keeping important facts from the wikipedia text by rewriting the content. They leverage GPT 4 Turbo as a data processing tool receiving two input channels : the geospatial context from OSM and the linguistic context from Wikipedia / Wikidata. Before they used to have paired space and text, now they have one merged narrative describing the location. 

You can think of it as such : 

```
San Jose is a major city in Silicon Valley in Northern California, located in Santa Clara County. It is closely connected to nearby cities like Santa Clara, Sunnyvale, and Mountain View, and is known as a technology hub.
```

---

**PRETRAINING**

The goal here is to teach a model that different views of the same place (textual description and spatial neighborhood) should end up having the same internal representation (one embedding per place). These two views are : the anchor-level input from GPT 4 Turbo and the neighbor-level input (pseudo sentences of nearby places, ordered by distance) from the geospatial data phase. 

Example :

Anchor-level input : 
```
“San Jose is a major technology hub located in Silicon Valley…”
```

Neighbor-level input : 
```
San Jose | Santa Clara | Sunnyvale | Mountain View
```

The research team is therefore training one model (GeoReasoner) to align both inputs, which is enforced by a contrastive loss. Both inputs are landing in a common shared vector space.  

For the anchor-level representation, they take only the token embeddings corresponding to the place name in the paragraph and average them. But remember that the entire paragraph is fed to the Transformer, so context shapes the entity embedding!

For example we give the transformer this sentence :
```
 "San Jose is a major technology hub located in Silicon Valley, near Santa Clara and Sunnyvale."
 ```

We tokenize it (simplified) :
```
 “[San] [Jose] [is] [a] [major] [technology] [hub] …”
```

The we identify the entity name span :
```
 “[San] [Jose]”
```

These two tokens now have embeddings like : 
```
“h_San  = contextualized(San | whole paragraph)
h_Jose = contextualized(Jose | whole paragraph)
“
```

We average them : 
```
h_loc = (h_San + h_Jose) / 2
```

For the neighbor entity information, they take the anchor entity, list the neighboring entities, sort them by distance and concatenate them into a pseudo sentence effectively allowing the Transformer to “read” spatial structure as a sequence. On top of ordering entities, the team is also injecting x, y coordinates in the same fashion as positional embeddings in standard Transformers. For the anchor level tokens, they use a special filler value **DSEP** to let the model know that this token does not have spatial grounding. The idea here is to decouple the pure text from the spatial information. One way to view this is to prevent the model to cheat from matching places via their coordinates.

Example : 

```
X-coord = DSEP
Y-coord = DSEP
```

 On top of all this they also add extra signals to every token : position ID like standard Transformers positional embeddings but also segment ID to indicate from which source the text is (anchor or neighbor). 

---

**LEARNING OBJECTIVE**

1)GEOSPATIAL CONTRASTIVE LEARNING (InfoNCE)

For the same place we they have :

```
h_loc_i = embedding from description
h_geo_i = embedding from neighbors
```

They roughly want **h_loc_i ≈ h_geo_i** but far from embeddings of other places. 

For each batch they are using 50% random negatives (we can guess any other places) and 50% hard negatives (most probably geographically or linguistically similar places) to ensure a fine discrimination, not just coarse matching.

2)MASKED LANGUAGE MODELING (MLM)

While contrastive loss aligns embeddings, MLM ensures the model still understands language. They concatenate both anchor and neighbor input, mask tokens and force the model to reconstruct them, therefore encouraging joint reasoning across text and space. Without the constrastive loss they loose grounding, and without MLM they result in a poor language understanding. 

---

**DOWNSTREAM TASK**

Here they use their GeoReasoner as a feature extractor. They add a small task specific head to it and check the quality of their learned geo-entity representations.  

1)TOPONYM RECOGNITION

The goal is to identify place names in raw text. 

Example : 
```
“"I traveled to San Jose last year."
Output : San Jose → LOCATION
```

Here they used GeoReasoner as follows : the input is plain text, the output are token embeddings, they add a simple classification layer on top and each token is classified as :

- B-topo (beginning of place name)
- I-topo (inside place name)
- O (not a place)

2)TOPONYM LINKING

Given a place name in text, we want to decide which real place it refers to. 

Example : 
```
“Paris” could mean Paris (France) or Paris (Texas). 
```

Here GeoReasoner is used like so :

- Extract embedding for the toponym mentioned
- Compare it to embeddings of candidate places from a geo database
- Retrieve the closest match

3)GEO-ENTITY TYPING

Here we want to assign a type to a place

Examples:
* restaurant
* hospital
* school
* transportation hub

Here is how they frame it :

- Input: representation of a geo-entity
- Output: class label
- Add: a simple classification head

It is to note that during downstream tasks, GeoReasoner does not necessarily get both views. There are situation where only text or only geo context is available. For example for geo-entity typing, only geospatial context is given during inference.

---

**RESULTS**

The research team used standard datasets for each downstream tasks. For toponym recognition they chose GeoWebNews, for toponym linking Local-Global Corpus and for Geo-Entity typing they tested their approach on an OSM-based dataset from SpaBERT. The baselines used for comparison include general Language Models like BERT, RoBERTa, SpanBERT and SimCSE, Entity-aware models like LUKE and SapBERT as well as Geo-aware models like SpaBERT and GeoLM.

For toponym recognition, GeoReasoner performs best overall, showing that the model learned what counts as a place, not just memorizing it. For toponym linking, it is best at top 1 and top 5 retrieval which is the strongest empirical validation of their core idea as linking requires true alignment. Finally for Geo-entity typing, GeoReasoner showcases best or second best results across most classes, suggesting the model has captured functional meaning even when only partial context is available. 

---

**ABLATION STUDIES**

Their ablation studies showed that removing the contrastive loss leads to a large performance drop confirming that the alignment is not accidental but central to the contrastive loss. They also show that removing the MLM loss degrades performance therefore showing that language modeling matters. The same conclusion holds when removing spatial embeddings, which confirms that coordinates encode real and useful information that ordering alone cannot capture. A clear degradation is also observed when removing LLM summarization showing that the cleaning integration step actually helps learning. 

---

*3rd February 2026*
