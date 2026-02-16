---
title: "An AI survival guide"
description: "Some advice and resources I have found helpful so far as a junior AI researcher."
pubDatetime: 2026-02-16T12:00:00Z
heroImage: /assets/img/2026/survival_guide_ai/survival_guide.png
tags: ["Post"]
featured: true
readingTime: ""
---

This blog post is my own attempt at helping any reader interested in AI learn, keep track of the fast progress and navigate the enormous amount of information without getting lost in the slop. I will provide some resources and advice I have found helpful during my own learning so far. I am only a junior in the field and I still have a lot to learn, but what has helped me can surely help anyone else, so take this post as a non-exhaustive, subjective starting point.

We’ll cover several aspects, such as curating your feed to get the right news, selecting the right resources to maximize your learning curve, exploring some helpful tools, benchmarks, and more. I am leaving the final section of this post for some resources.


# Cutting through the noise: curating your feed

![Curating your feed](/assets/img/2026/survival_guide_ai/curating_feed.png)

If there’s one exciting thing about AI right now, it’s the amount of new releases. Every week or even couple of days, we get a major release. I think this is something particularly unique at this point in time and it makes the learning process even more exciting, challenging and fun. I don't think other engineering domains get to experience this "Netflix-like" vibe. At least I didn't see any such parallel in say civil or mechanical engineering so far, or not at this scale. However the fast-growing AI world also comes with downsides. You just have to open Linkedin to get a glimpse of it. A lot of slop, unrealistic claims, psychosis and hype and it can be hard to distinguish what matters from the clutter. So the first thing I would suggest is to get the right information, at the right time and in the right place to keep up with new releases as they come. 

From my own experience, the best way to get a good feed of news right now is twofold: newsletters and X (twitter). Now the latter is highly controversial as X can be a very toxic / sloppy place too, but it's all about following the right people and sticking to the notifications of these people and avoid the homepage like the plague. 

## Newsletters

I don’t know much about newsletters, but I’ve stuck with one in particular for several months and I think it might be worth your attention: [AINews by smol.ai](https://news.smol.ai/). This newsletter is an AI roundup summarizing discussions across AI communities (mainly from X and Reddit) and created by customizable research agents. It was founded by Shawn Wang, currently AI Engineer in San Francisco. I personally enjoy this format, and mainly use it to get the main headlines at a glance. I often only go through the X summary and read between the lines. However some issues I can note are : very often images are not displayed in my inbox or sometimes I do not receive the email at all. So most of the time, I would check their website directly. 

## X feed

As mentioned earlier, X can be a great place to keep up with the news, learn and interact with the community. The value you will get out of it only depends on your own usage. But I will try to give you some advice as a first idea for you to start. I never or almost never visit the homepage. The X algorithm is not of my taste, it would often recommend the same content over and over again, some good content would be lost in the middle of the slop, the psychosis and a bunch of people claiming bold predictions. I would recommend you to avoid the homepage if your goal is to maximize the value you get out of twitter and make much better use of your time. That's why 99% of my usage is only spent in the notifications tab where I only get to see the posts and replies from the people I actually care about. In this feed I would get detailed blog posts regarding technical topics (e.g a recent blog post on a tiny model to prove theorems : [qed-nano-blogpost](https://huggingface.co/spaces/lm-provers/qed-nano-blogpost)), latest AI model benchmarks (e.g [Designarena on X (post)](https://x.com/Designarena/status/2022467169314111882?s=20)), miscellaneous projects / blog posts (e.g [Simon Willison on X (post)](https://x.com/simonw/status/2022455798656581732?s=20)), new model releases (e.g [omarsar0 on X (post)](https://x.com/omarsar0/status/2022384166034190528?s=20)), AI adoption in the industry (e.g [bcherny on X (post)](https://x.com/bcherny/status/2022367945704481116?s=20)) and so much more. Obviously you will still find people with bold claims and everyone is having their own opinions on the topic, commercial incentives and so on but overall it is fairly easy to build a trustworthy feed to stay up to date, find great reads, explore new ideas. Another great thing about X is that you can start interacting with the community as well by asking for explanations when in need, contributing to some projects with your own work and so on. I list some X accounts as suggested resources for you to explore in the final section of this post. 

## Keeping track of benchmarks 

Even though your newsletter and your X feed will have already given you a good idea of which benchmarks to look at, I am dedicating a small section here to reference some benchmarks you might want to keep an eye on. First of all a good default can be [Arena](https://arena.ai). This is a community driven benchmark where models get evaluated by users who prompt models on real tasks. Users vote on which model provides the most satisfactory answers to their query and accordingly models get ranked across several categories (Code, Vision, Text...). You can also chat with many of these models for free and vote to help the community assess these models.

 I would also mention [METR](https://metr.org/). This organization is quite famous for the task-completion time horizon evaluation which is the task duration, measured by human expert completion time, at which an AI agent is predicted to succeed with a given level of reliability.
 
  For a broad overview of models capabilities, you can also visit [LiveBench](https://livebench.ai/#/) which is a challenging and contamination-free benchmark sponsored by [Abacus.AI](https://abacus.ai/). They release new questions regularly and the evaluation spans a diverse set of tasks which are all verifiable eliminating therefore the need for any LLM as a judge. 
  
  Finally [ARC-AGI](https://arcprize.org/arc-agi) is having a set of very interesting benchmarks to measure fluid intelligence (i.e focusing on the ability of models to learn new skills). There are obviously a lot more benchmarks you can follow and new ones are often released but this is not my goal to list them all here. I leave it to you to explore and choose your own favourites :)

# Learning the theory

![Learning the theory](/assets/img/2026/survival_guide_ai/learning_theory.png)


If you have already curated your feed properly, you will soon realize that there is already a lot to learn from. Not necessarily with the posts themselves but rather with the content these posts will redirect you to. However there are still many resources on which you can rely to strengthen your foundations in AI. 

## Research papers

The first medium I can recommend for you to learn is reading research papers. It is one of the most trustworthy source of information you can find but it is also highly technical and the entry barrier knowledge-wise can be quite high. But the good news is that it has never been easier to look for the research papers you may be interested in as well as breaking them down. To find the right paper you can obviously use [Arxiv](https://arxiv.org/) or [Google Scholar](https://scholar.google.com/) but what I would most of the time rather do is spin up an LLM to understand my precise intent and find the paper for me, and most often end up reading it on arxiv. Perplexity used to be my default "go to" for such tasks, but I am not sure if the gap is still real in terms of reliable source retrieval among LLM providers. On this I would rather suggest you to try different providers and stick to the one providing you the best results. Now when it comes to break down research papers, I found it also helpful to keep an LLM on the side to ask questions throughout your reading process. Lately, [OpenAI Atlas](https://openai.com/index/introducing-chatgpt-atlas/) stood out as a convenient option for this use case according to me. You get to have your research paper as the main page of the browser and a little chat on the right side which removes the burden of switching back and forth between tabs, copy paste content here and there... You can simply ask for clarification regarding the paper, drop your best ELI5 prompt at complicated jargon and get the gist of something you are not familiar with. Overall I would suggest to always try to leverage LLMs to deepen your understanding rather than offloading your cognitive tasks. It's not simple, it requires efforts and our brains are lazy by nature and would often prioritise the easiest option. We have all been there...

Another useful tool worth mentioning is [Deepwiki](https://deepwiki.com/). Whenever you stumble upon a technical repository, or poorly documented, or simply want a useful and convenient way to browse and understand a repository, simply copy paste the github link and replace "github" with "deepwiki" in the url. The repository will turn into a detailed report breaking down exactly what is the repo about and let you ask follow up questions on it. 

## Books

Another medium for you to explore, which might be more accessible, are books. I indeed think books are a great way to learn AI because while research papers are most of the time pretty concise, highly technical and often require a prior domain knowledge, conversely books are often breaking down notions from first principles, take time to gradually build the foundations needed for the reader to follow, without compromising on the depth and expertise. Some great books also usually come with pieces of code which can be a good way for you to follow along in an IDE and some even have exercises. Here are some great sources I would recommend, which you will also find in the final resources section :

- [Deep Learning with Python](https://deeplearningwithpython.io/) - François Chollet
- [Reinforcement Learning from Human Feedback](https://rlhfbook.com/) - Nathan Lambert
- [Build a Large Language Model from Scratch](https://www.amazon.in/Build-Large-Language-Model-Scratch/dp/1633437167) - Sebastian Raschka
- [Build a Reasoning Model from Scratch](https://www.manning.com/books/build-a-reasoning-model-from-scratch?utm_source=raschka&utm_medium=affiliate&utm_campaign=book_raschka2&a_aid=raschka&a_bid=4c3c5398&chan=mm_github) - Sebastian Raschka

There are obviously many more good references, and many which I am not even aware of, but these are my own readings and the ones patiently waiting on my reading list for me to give them some time. 

## Blog posts / articles

Blog posts and articles are a great format which I enjoy a lot too. They can be very technical as well as covering miscellaneous topics. They are usually a lot more accessible than research papers but less dense than books (even though it depends on which ones). The authors generally adopt a style which is a lot more educational and they usually care about the understanding of their audiences. Here are some blogs and articles along with examples I would recommend you to check: 

- Andrej Karpathy (e.g [Deep Neural Nets: 33 years ago and 33 years from now](https://karpathy.github.io/2022/03/14/lecun1989/))
- Hugging Face (e.g [Community Evals](https://huggingface.co/blog/community-evals))
- Simon Willison (e.g [The evolution of OpenAI’s mission statement](https://simonwillison.net/2026/Feb/13/openai-mission-statement/))
- François Chollet (e.g [The implausibility of intelligence explosion](https://medium.com/@francois.chollet/the-impossibility-of-intelligence-explosion-5be4a9eda6ec))
- Andrew Ng (e.g [On the job market](https://www.deeplearning.ai/the-batch/issue-339/))
- Anthropic (e.g [How AI assistance impacts the formation of coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills))
- OpenAI (e.g [Measuring AI’s capability to accelerate biological research in the wet lab](https://openai.com/index/accelerating-biological-research-in-the-wet-lab/))
- EpochAI (e.g [What will AI look like in 2030?](https://epoch.ai/blog/what-will-ai-look-like-in-2030))



## Youtube videos


Finally a last medium I enjoy is simply youtube videos. Once again, just like X, it all comes down to who you are following. You can find very qualitative content there, just like you can find sloppy "AI experts"... Youtube is great because it is much more entertaining and can also provide a different way to learn. You get to see some great animations, how people work, get testimonies or simply have fun. Here are some great youtube channels I personally enjoy :

- [Andrej Karpathy](https://www.youtube.com/@AndrejKarpathy) - My all time favorite, builds LLMs from scratch
- [Stanford Online](https://www.youtube.com/@stanfordonline) - Online courses from Stanford
- [Welch Labs](https://www.youtube.com/@WelchLabs) - Educational videos, breaking down research papers / concepts
- [Underscore](https://www.youtube.com/@Underscore_) - Podcasts often involving guests on practical AI applications in the industry
- [Two Minute Papers](https://www.youtube.com/@TwoMinutePapers) - Papers breakdown
- [AI Explained](https://www.youtube.com/@aiexplained-official) - Creator of SimpleBench, giving interesting point of views on AI news
- [Caleb Writes Code](https://www.youtube.com/@CalebWritesCode) - Blackboard breakdown of AI latest news
- [Thu Vu](https://www.youtube.com/@Thuvu5) - AI projects, Data Science
- [Lex Fridman](https://www.youtube.com/@lexfridman) - Podcasts on diverse topics including AI

more in the resources section...

# Building 

![Building](/assets/img/2026/survival_guide_ai/building_from_scratch.png)


## Maximizing your learning curve 
As cool as learning theory can be, it won't take you that far unless you actually put it into code. One of my favorite ways of learning is by building things from scratch. This *philosophy* of learning is what [Andrej Karpathy](https://www.youtube.com/@AndrejKarpathy) is promoting in its GitHub repositories and educational videos, and it has highly influenced me in my way of approaching AI. It's pretty simple to understand : you are going to code every single thing, character by character, in your IDE. The tokenizer, the attention mechanism, the MLP, the LayerNorm, the training loop and so on. You split your screen in two, one of his videos on one side, your IDE on the other and you follow along. If you are already familiar with your AI fundamentals you can just build it on the first watch. If you are starting fresh; you might want to watch his videos several times: a first time without coding anything, just for you to understand the big picture and what is being built and why (you can prompt your favorite LLM to also help you understand concepts along the way) and then a second pass where you pause, code and repeat. This is an amazing way to learn and understand the concepts from first principles, rent and spin up your first GPU instance, understand how LLMs work in depth and it is very satisfying to get to build your own GPT. For GPU renting here are some options: [Lambda](https://lambda.ai/), [Vast.ai](https://vast.ai/). I personally use and like Vast.ai. The best part is that you also get to have a project to add to your portfolio. You can find more content of this kind from [Umar Jamil](https://www.youtube.com/@umarjamilai) as well, who works at Mistral AI and adopts the same style of building things from scratch.  


## Using AI Agents

Even though the resources above are a great place for you to start building, nowadays it is ridiculously easy for you to basically build anything from scratch by using any LLM out there. My favorite way to do so is using an IDE with an AI Agent integrated (e.g I like [Antigravity](https://antigravity.google/) for this use case so I don't have to jump back and forth between tabs, everything is in one place). You pick something you want to build and simply ask the LLM to guide you from scratch end to end. Again it is your responsibility to make the effort of writing the code character by character, ask follow up questions, dig into concepts you do not fully understand and so on. The AI Agent is helpful because it will go off on its own reading your files, reviewing your work, pinpointing mistakes but if you use it to get all the code written, I believe the educational value is a lot worse, which is the reason why I would discourage you to do so.

To dig a little more on this topic, I see three main "healthy" use cases of AI agents in my workflows :

- 1) The first use case is the one describe above. The AI agent is here to review your work, provide guidance, breakdown concepts. You are fully in charge of coding character by character. You goal is to maximize your understanding of whatever you do. 

- 2) Within a project you actually care about, you use AI agents to write some parts of your code, which you systematically review, understand and ask follow up questions on if you struggle to understand. You hopefully get some productivity gains but you stay in control and you understand what you and the agent produced. I would use this in a context where I am already confident to know this kind of task enough, and would go back to 1) if there is anything new to me.

- 3) On a toy project or on a project you care about but for which the technical barrier is too high for you to start learning from first principles, or simply do not want to take the time to gain any of the skills required, then you fully let the agent code without or little review: you vibecode your best life. 

## On "Vibecoding"

Coming back on 3) I would still recommend some best practices while doing so, and here are a few: begin your project with a PRD, split it in epics, user stories and sprints. Make sure these documents are highly detailed and updated along the way of your project so that you can easily come back to it, if you use multiple agents or if you are stuck on something, run out of credits... Build your project as CLI-first so your agent can self verify its own work and close the feedback loop. While vibecoding, do not ask the agent to just go off do everything but proceed step by step, sprint by sprint. At the end of a sprint, ask for all the new features to be tested (unit tests, regression tests yadayada) and refactor the code if necessary. Ask your agent to use several "quality tools" to make sure the code produced respect at least certain standards (Prettier, ESLint, Playwright, Husky, ruff, black, pytest, mypy, pre-commit and so on). Keep the codebase up to date with the documentation, use branches or worktrees if you spin up agents in parallel or subagents. I am not diving in details but there are a few things you can leverage as well by customizing AGENTS.md / CLAUDE.md, skills and [MCPs](https://www.anthropic.com/news/model-context-protocol). So far I have enjoyed [Codex](https://chatgpt.com/codex) a lot and especially the app, [Claude Code](https://claude.com/product/claude-code) with Anthropic subscription even though too costly for the ridiculous usage provided, and [Minimax](https://www.minimax.io/) coding plan paired with Claude Code (you just switch the model in Claude Code), they have a plan for 10 bucks which renew your usage every 5 hours and will never leave you out of credits.

Vibecoding is fun, but the reality is that, on the job market, at least from what I have seen, the diffusion of AI agents is slow and it's better for you to stick to 1) and 2), at least as a junior, and keep 3) for your fun weekend projects. You have high chances that your current or future workplace will either forbid the use of LLMs for security, IP reasons and so on, take forever to adopt them,  have its own in house LLM which is just a chatbot and is lacking behind in coding capabilities. But it could simply be that you do not even get the chance to onboard because you failed their interview when they asked you to implement a PyTorch module using Grouped Query Attention, RoPE and all the good stuff (without access to any LLM obviously). In this case you go back to 1), because you will learn a lot more and make yourself a lot more valuable on the market instead of simply having a blast on 3) but not learning anything. 

 TLDR : anyone can prompt, only a few can code. Better for you to learn fundamentals.


# Collaborating

![Collaborating](/assets/img/2026/survival_guide_ai/collaborating.png)

Another great way of furnishing your portfolio and learn is to collaborate with people on some projects or get some relevant experiences as a student. It can take several forms, but here are a few :

- Ask a friend who is also into AI to collaborate on a project with you 
- Participate in hackathons. You will meet people, build things, have fun, hopefully get a prize and can add that to your CV
- If you are still a student you can join a club or create your own
- Again as a student it can be very interesting for you to explore both the industry and the research world through some internships. This is a good way for you to get a glimpse of what is available and what you like the most + learn a lot
- Join Discord servers, meet people and start building with them, here a few ideas of servers : Hugging Face, Mistral AI, Eureka Labs
- You can always try to contact supervisors you had in previous research internships, or colleagues with who you stayed in touch and check if they have some projects / research topics going on which you could help with.


# Sharing your contributions

![Sharing your contributions](/assets/img/2026/survival_guide_ai/sharing_contributions.png)

The most common way to share your contributions is to wrap it as a repository on [GitHub](https://github.com/) which can then be part of your portfolio of projects. If you have trained a model or curated a dataset, you can also push it to [Hugging Face](https://huggingface.co/). This way you will contribute to the amazing world of Open Source and if you get lucky could eventually gain some traction by the community to value your work. 

If you are working in research you obviously would want to get published in a conference or a journal and if possible as a first author. I am not going to dive into this as I assume if you are working in research you know that since day 1. 

One way to also share your contributions is to create your own website, start blog posting about the projects you have done, sharing these blog posts on social media. You can easily build your own website if you have the skills for, obviously, but at the era of vibecoding and if you don't care about your web dev skills, you can also get it done fairly easily by either starting fresh with your favourite AI agent or forking a website template you like on GitHub and adapt it. [Vercel](https://vercel.com) can be an easy deployment option for your to serve your website and which is the one I personally use. If you want to buy your own domain, I personally use [Cloudflare](https://www.cloudflare.com). You can buy your own domain name for roughly 10 bucks a year if you opt for a .com. Lastly linking your projects to your CV is common sense. 

Thank you so much for reading all the way till here, I hope it was helpful to you in one way or another. Do not hesitate to reach out if you have any questions, remarks or whatsoever, I would be happy to discuss!


# Resources

## Newsletters

- [AINews by smol.ai](https://news.smol.ai/) — AI roundup summarizing discussions across AI communities.

## X (twitter)

#### AI labs / product orgs
- [OpenAI](https://x.com/OpenAI) — AI research & product company (GPT models).
- [Anthropic](https://x.com/AnthropicAI) — AI lab behind Claude.
- [Google DeepMind](https://x.com/GoogleDeepMind) — AI research lab (Gemini, AlphaFold, etc.).
- [Mistral AI](https://x.com/MistralAI) — French AI lab building open + commercial LLMs.
- [Meta AI](https://x.com/AIatMeta) — Meta’s AI org (Llama, research + applied AI).
- [Nous Research](https://x.com/NousResearch) — open-model research collective / org.
- [Qwen (Alibaba)](https://x.com/Alibaba_Qwen) — Alibaba’s Qwen model team.
- [Kimi (Moonshot AI)](https://x.com/Kimi_Moonshot) — Moonshot AI’s Kimi assistant/model.
- [ElevenLabs](https://x.com/elevenlabsio) — AI voice / speech generation company.
- [Cohere Labs](https://x.com/Cohere_Labs) — Cohere’s research arm (LLMs, retrieval, evals).
- [MiniMax](https://x.com/MiniMax_AI) — AI company building foundation models + products.
- [DeepSeek](https://x.com/deepseek_ai) — AI lab known for open model releases.
- [Sesame](https://x.com/sesame) — voice AI company.
- [Abacus.AI](https://x.com/abacusai) — AI platform behind LiveBench.

#### Benchmarking / evaluation / research 
- [LMArena / Arena](https://x.com/arena) — community-driven model benchmarking + leaderboards.
- [METR](https://x.com/METR_Evals) — nonprofit evaluating AI capabilities.
- [Andon Labs](https://x.com/andonlabs) — agent company / “autonomous orgs” experiment.
- [Epoch AI](https://x.com/EpochAIResearch) — AI trends + forecasting research org.
- [Daily Papers](https://x.com/HuggingPapers) — paper highlights / research digest account.
- [Designarena](https://x.com/Designarena) — AI model benchmarks and design evaluations.

#### Researchers / builders / founders (individuals)
- [Simon Willison](https://x.com/simonw) — independent engineer/writer (Datasette), posts practical AI tooling.
- [Andrej Karpathy](https://x.com/karpathy) — AI researcher/educator; influential in deep learning + LLM engineering.
- [Yann LeCun](https://x.com/ylecun) — deep learning pioneer; Meta AI chief scientist.
- [Geoffrey Hinton](https://x.com/geoffreyhinton) — deep learning pioneer.
- [Richard S. Sutton](https://x.com/RichardSSutton) — foundational reinforcement learning researcher.
- [Demis Hassabis](https://x.com/demishassabis) — CEO/co-founder of DeepMind.
- [Andrew Ng](https://x.com/AndrewYNg) — ML educator/entrepreneur (DeepLearning.AI).
- [Sam Altman](https://x.com/sama) — CEO of OpenAI.
- [Dario Amodei](https://x.com/DarioAmodei) — CEO/co-founder of Anthropic.
- [Mira Murati](https://x.com/miramurati) — AI product/research leader.
- [Ilya Sutskever](https://x.com/ilyasut) — AI researcher; co-founder of OpenAI.
- [François Chollet](https://x.com/fchollet) — creator of Keras; AI researcher/author.
- [Arthur Mensch](https://x.com/arthurmensh) — CEO/co-founder of Mistral AI.
- [Clément Delangue](https://x.com/ClementDelangue) — CEO/co-founder of Hugging Face.
- [Thomas Wolf](https://x.com/Thom_Wolf) — co-founder of Hugging Face.
- [Julien Chaumond](https://x.com/julien_c) — co-founder/CTO at Hugging Face.
- [Nathan Lambert](https://x.com/natolambert) — AI researcher (often posts on open models/RL/reasoning).
- [Elie Bakouch](https://x.com/eliebakouch) — ML researcher at Hugging Face (open LLM training work).
- [A. N. Angelopoulos](https://x.com/ml_angelopoulos) — ML eval/measurement researcher.
- [Guilherme Penedo](https://x.com/gui_penedo) — ML/research engineer (datasets/training in the HF ecosystem).
- [Rémi Cadene](https://x.com/RemiCadene) — open-source ML engineer/researcher (vision/robotics tooling).
- [Peter Steinberger](https://x.com/steipete) — macOS/iOS developer; creator of OpenClaw.
- [Boris Cherny](https://x.com/bcherny) — creator of Claude Code; posts on developer tools and AI coding workflows.
- [Omar Sar0](https://x.com/omarsar0) — AI/ML builder & commentator (tools/ideas).
- [AI Explained](https://x.com/AIExplainedYT) — creator explaining AI news/tech.
- [Shawn Wang (swyx)](https://x.com/swyx) — AI engineer, founder of smol.ai.
- [Sebastian Raschka](https://x.com/rasbt) — AI researcher, author and educator.
- [Umar Jamil](https://x.com/hkproj) — AI builder at Mistral AI, coding concepts from scratch.

## Books

- [Deep Learning with Python](https://deeplearningwithpython.io/) - François Chollet
- [Reinforcement Learning from Human Feedback](https://rlhfbook.com/) - Nathan Lambert
- [Build a Large Language Model from Scratch](https://www.amazon.in/Build-Large-Language-Model-Scratch/dp/1633437167) - Sebastian Raschka
- [Build a Reasoning Model from Scratch](https://www.manning.com/books/build-a-reasoning-model-from-scratch?utm_source=raschka&utm_medium=affiliate&utm_campaign=book_raschka2&a_aid=raschka&a_bid=4c3c5398&chan=mm_github) - Sebastian Raschka

## GPU Renting

- [Lambda](https://lambda.ai/) — GPU cloud for deep learning.
- [Vast.ai](https://vast.ai/) — Marketplace for low-cost GPU rental.

## Blog posts & Articles

- [Deep Neural Nets: 33 years ago and 33 years from now](https://karpathy.github.io/2022/03/14/lecun1989/) — Andrej Karpathy
- [Community Evals](https://huggingface.co/blog/community-evals) — Hugging Face
- [qed-nano-blogpost](https://huggingface.co/spaces/lm-provers/qed-nano-blogpost) — Blog post on a tiny model to prove theorems.
- [The evolution of OpenAI’s mission statement](https://simonwillison.net/2026/Feb/13/openai-mission-statement/) — Simon Willison
- [The implausibility of intelligence explosion](https://medium.com/@francois.chollet/the-impossibility-of-intelligence-explosion-5be4a9eda6ec) — François Chollet
- [On the job market](https://www.deeplearning.ai/the-batch/issue-339/) — Andrew Ng
- [How AI assistance impacts the formation of coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills) — Anthropic
- [Measuring AI’s capability to accelerate biological research in the wet lab](https://openai.com/index/accelerating-biological-research-in-the-wet-lab/) — OpenAI
- [What will AI look like in 2030?](https://epoch.ai/blog/what-will-ai-look-like-in-2030) — EpochAI

## Youtube Channels

- [Lex Fridman](https://www.youtube.com/@lexfridman) - Podcasts on diverse topics including AI
- [Dwarkesh Patel](https://www.youtube.com/@DwarkeshPatel) - Podcasts, same style as Lex Fridman
- [Underscore](https://www.youtube.com/@Underscore_) - Podcasts often involving guests on practical AI applications in the industry
- [AI Explained](https://www.youtube.com/@aiexplained-official) - Creator of SimpleBench, giving interesting point of views on AI news
- [3Blue1Brown](https://www.youtube.com/@3blue1brown) - Educational videos, great 3D animations
- [Welch Labs](https://www.youtube.com/@WelchLabs) - Educational videos, breaking down research papers
- [Caleb Writes Code](https://www.youtube.com/@CalebWritesCode) - Blackboard breakdown of AI latest news
- [Fireship](https://www.youtube.com/@Fireship) - Humoristic videos on SWE / AI news
- [Thu Vu](https://www.youtube.com/@Thuvu5) - AI projects, Data Science
- [The PrimeTime](https://www.youtube.com/@ThePrimeTimeagen) - Humoristic videos on SWE / AI news 
- [Julia Turc](https://www.youtube.com/@juliaturc1) - AI explainer videos from a former Google research engineer 
- [Two Minute Papers](https://www.youtube.com/@TwoMinutePapers) - Papers breakdown
- [Umar Jamil](https://www.youtube.com/@umarjamilai) - Break down / code AI concepts from scratch
- [Yannic Kilcher](https://www.youtube.com/@YannicKilcher/videos) - Break down AI research papers
- [Stanford Online](https://www.youtube.com/@stanfordonline) - Online courses from Stanford
- [Shaw Talebi](https://www.youtube.com/@ShawhinTalebi) - Applied AI, AI builder
- [EpochAI](https://www.youtube.com/@Epoch_AI_Research) - AI Podcasts
- [GPU MODE](https://www.youtube.com/@GPUMODE) - AI technical lectures
- [Andrej Karpathy](https://www.youtube.com/@AndrejKarpathy) - My all time favorite, builds LLMs from scratch
- [Sebastian Raschka](https://www.youtube.com/@SebastianRaschka) - Educational AI videos, from scratch


## Discord Servers

- Hugging Face
- Mistral AI
- Eureka Labs

## Benchmarks 

- [Arena](https://arena.ai) — Community-driven model evaluation.
- [METR](https://metr.org/) — Evaluating AI task completion capabilities.
- [LiveBench](https://livebench.ai/#/) — Challenging, contamination-free benchmark.
- [ARC-AGI](https://arcprize.org/arc-agi) — Measuring fluid intelligence in AI.

## Other Tools & Platforms

- [Arxiv](https://arxiv.org/) — Open-access archive for research papers.
- [Google Scholar](https://scholar.google.com/) — Search engine for scholarly literature.
- [Perplexity](https://www.perplexity.ai/) — AI-powered search and information discovery.
- [OpenAI Atlas](https://openai.com/index/introducing-chatgpt-atlas/) — AI native browser
- [Deepwiki](https://deepwiki.com/) — Tool for browsing and understanding GitHub repositories.
- [Hugging Face](https://huggingface.co/) — Platform for models, datasets, and ML apps.
- [GitHub](https://github.com/) — Code hosting and collaboration platform.
- [Vercel](https://vercel.com) — Cloud platform for front-end developers.
- [Cloudflare](https://www.cloudflare.com) — Web infrastructure and security services.
- [Antigravity](https://antigravity.google/) — Agentic AI coding assistant (IDE integrated).
- [MCPs](https://www.anthropic.com/news/model-context-protocol) — Model Context Protocol for connecting AI models to data/tools.
- [Codex](https://chatgpt.com/codex) — Specialized AI interface for coding and development.
- [Claude Code](https://claude.com/product/claude-code) — CLI tool using coding agents.
- [Minimax](https://www.minimax.io/) — Chinese coding agent, very affordable.
