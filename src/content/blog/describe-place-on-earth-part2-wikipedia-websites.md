---
title: "How to describe a place on Earth using text? Part 2 : More wikipedia and websites/descriptions"
description: "In the second part of this blog post series, we are going to explore new ways in which we can collect geolocated text (i.e. text tied to a geographic position on Earth)."
pubDatetime: 2026-09-01T12:00:00+02:00
tags: ["Post"]
featured: false
draft: false
---

In the second part of this blog post series, we are going to explore new ways in which we can collect geolocated text (i.e. text tied to a geographic position on Earth). In Part 1, we introduced how one can describe an area on earth using coordinates, nodes and polygons, along with a first low hanging fruit to fetch text for this area : using the wikidata tag from Open Street Map. In this write-up, we are going to squeeze a bit more juice out of wikidata, before moving on to a new family of tag : "website" and "description".

# 1) A quick recap:

In the first part of our series, we fetched all polygons having a "wikidata" tag associated. This resulted in a set of 1,184,110 polygons. We also saw that this tag gives us a unique identifier for each polygon and therefore we were able to retrieve wikidata text associated with each geographic entity. After doing so we were able to collect roughly 800 M words spanning 351 languages. However, after a simple analysis, we noticed that this dataset was heavily skewed towards certain part of the world (and a first glance seems to correspond to developed regions). Now this is a good first iteration, but how can we expand ?

# 2) The return of Wikipedia :

It turns out that while exploring the OpenStreetMap Wiki, one will notice that some features (OpenStreetMap map entities) may hold a "wikipedia" tag. A good first instinct you may have picked up from Part 1 is to check on Tag Info some statistics about this tag.

<p class="text-sm opacity-70 text-center mt-2">Figure 1 : Side by side TagInfo stats "wikidata" VS "wikipedia"</p>

Looking at figure 1, we can roughly conclude that the wikipedia tag has a coverage about twice less important as the wikidata tag. But nothing prevents them from non overlapping, and this means we could hope to retrieve text that we may have "missed" since uncovered by the wikidata tag. The reasons behind that may be diverse, but an example could be that a mapper on OpenStreetMap may have used one tag and not the other while describing the object.

In practice the Wikipedia tag looks like this : "wikipedia = language: page title". After checking that the value of this tag does not already exist in the data fetched by our first iteration with wikidata, we can use the MediaWiki API to retrieve the articles which are genuinely "novel". Using this method, we obtain a total of 28,384 polygons which are newly added and fetching their related documents give us roughly 18,7 M additional words. Figure 2 plots the additional polygons, which are strongly biased towards Europe, USA, Japan. This is a modest but useful complement

<p class="text-sm opacity-70 text-center mt-2">Figure 2 : World Map</p>

# 3) Websites

Now that we have extensively used wikidata, it is about time to find new sources of text. After exploring the tags available on Open Street Map, one will quickly find out that some of them link entities to websites. This is what the tags "website" and "contact:website" are for. What is really interesting with this new source is that it is going to help us diversify the dataset we built so far based on wikidata. We can hope to retrieve text with a different writing style, and a different content. Although it is to be expected to not find text as clean as wikidata and maybe not as tailored to the polygon.

|  |  |
| --- | --- |
| Polygons with extracted text | 1,192,980 |
| "website" words | 368,215,417 |
| "contact:website" words | 29,381,303 |

<p class="text-sm opacity-70 text-center mt-2">Table 1 : Statistics for the "website" dataset</p>

Looking at table 1, we can see that these tags are covering about as many polygons as the wikidata dataset, namely roughly 1,2 million polygons. However the total number of words reaches about 400 millions in count, which is roughly half the wikidata dataset. The same geographic bias can be observed on Figure 3.

One will also notice the overwhelming dominance of the website tag, accounting for most of the extracted text.

<p class="text-sm opacity-70 text-center mt-2">Figure 3 : World Map Website</p>

# 4) What is the overlap between wikidata / website?

Now that we have both the wikidata and website datasets, we can say that we have roughly 1,2 billions words. We also know that both these datasets are having a geographic distribution which is highly uneven. But an interesting question is whether these datasets overlap. In other words it would be interesting to know whether the text we extracted describe the same set of polygons across wikidata and website tags or whether they have a more diverse coverage.

Let's consider only polygons having non empty text associated. For wikidata this corresponds to 684,411 polygons while for website there are 1,192,980 such polygons. Across both tags the overlap between the two is of 529 polygons. That's 0,077 % of the former dataset and 0,044 % of the latter. Said differently, the two datasets describe two very different sets of polygons.

# 5) Final words :

This second part concludes a first phase of this series. Fetching geolocated text from the wikidata and website tags is the lowest hanging fruit I have found so far in terms of high quality text. I found other tags which could be interesting like the "description" tag but in practice the quality turns out to be quite poor and the yield a lot scarcer. Subsequent approaches to extract geolocated text may involve more ambitious methods which I am currently working on and will deserve their own part in this series. Stay tuned :)
