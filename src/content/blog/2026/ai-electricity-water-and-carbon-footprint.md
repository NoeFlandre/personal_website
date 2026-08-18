---
title: "What is the impact behind our AI usage?"
description: "A blog post where I try to give a rough estimate of my codex usage impact."
pubDatetime: 2026-08-18T12:00:00+02:00
tags: ["Post"]
heroImage: /assets/img/2026/ai-electricity-water-and-carbon-footprint/codex-profile.png
draft: false
unlisted: false
---

You are going to the supermarket to buy some groceries. While walking around, you see these beautiful avocados beside some tomatoes. Why not getting one or two? It’s been a long time you didn’t make guacamole at home. So you check whether they started to ripen or not. You check a bunch of them for a little while, and you finally settle with two avocados which are looking good.

While doing so, and it’s perfectly natural, there is an overwhelming chance you never thought about the land needed to grow these, the water they consumed and all the pesticides required. Why would you? That’s not something one is thinking about when they go for groceries. We are rather concerned about not forgetting anything, not spending too much and so on.

However, these questions are real and deserve our attention, otherwise no avocado in your plate, and no guacamole tonight. Factually, you need land, water and pesticides if you want to grow avocados, whether you considered it or not.

So maybe you are going to give it a thought in the end. So you start reading the [wikipedia page](https://en.wikipedia.org/wiki/Avocado) about the avocado since you are a little curious.
You notice another name for it: the alligator pear. Cute. And funny also.

Then you go down the page and you notice that growing avocado requires 18 times more water than growing tomatoes. Less fun. On top of that it’s written that avocado farming is implicated in deforestation and human rights concerns.

All in all, we are maybe going to skip guacamole for tonight.

Likewise when we use AI, I believe we are quite disconnected to what it means in reality to train and serve the models we are prompting. The infrastructure, the electricity cost, the water consumed and the carbon footprint emitted for instance.

And sadly it is a topic I do not hear much about in the AI community. I might be wrong, but most people I am following are never talking about such concerns, and rather blindly being “data center bullish”. Everything we do, online or not, is having a physical impact, whether we choose to ignore it or not.

I had the chance to visit at least two datacenters which are tiny in comparison to what is being built nowadays. Yet it's pretty impressive to see all these racks, to hear the noise it produces and the scale of all this. Maybe this is a good first step to actually realize what is the hidden story behind the ChatGPT interface. And, just to make things clear, I am not trying to spit on AI and shouting that building data centers is an horrific idea. I am just trying to give the reader some awareness about these topics, as one should be a minimum aware of the impact of their actions and subsequently take their own decisions.

I have been using coding agents for a while now, especially Minimax M2.7 and M3 inside the droid harness and also Codex. One nice thing about codex is that you can see your token consumption (see the hero image for this blog post). My lifetime tokens on codex is at 26.4B. Fine. Is that a lot? How much is it? Did you consume more or less than that?

In order to get a sense of what means, I would like to have a comparison. How many showers wasted for these tokens? How many kilometres with a car I could have done instead?

Now that’s a complicated matter. You would have to take into account the model training, the entire process to make the chips, the serving cost, the datacenter construction and so much more if we wanted to be exhaustive. That’s a lot. That’s too much to consider. But I want to have a rough estimate, at least an order of magnitude.

So let’s consider only the serving cost. Simply what is needed to power the chips, cool them down and how much carbon equivalent they emitted while I was prompting GPT. This problem on its own is actually very hard. A token is not the same unit across models (some different tokenizers would produce more or less token for a given text). And even if you were to use the same tokenizer, the model size can vary, input and output tokens may not cost the same, the way the electricity was produced too… It’s endless.

My goal here is not to write a scientific, rigorous blog post to precisely quantify the real impact of these tokens I used. It’s a job on its own. My goal is simply to give us a rough estimate of what would be the order of magnitude.

Ok. Having said that, I need some numbers then.

I am going to rely on a few sources. The [first one](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use), is a study from EpochAI, dating from February 2025. In this study, they found that a typical GPT 4o query consumes roughly 0.3 watt-hours. Now you could argue that today’s GPUs are maybe more efficient, and batching and model size and yadayada. However this is going to be my rough reference for electricity footprint.

Now, moving on to water consumption. I found [this paper](https://arxiv.org/html/2304.03271v4) named "Making AI Less “Thirsty”: Uncovering and Addressing the Secret Water Footprint of AI Models". Dated from January 2025, they estimated an US average of roughly 30 requests for 500 mL of water for a request of 0.004 kWh. I am assuming most of my codex requests are routed to a datacenter in the US, so I am confidently taking this estimate for my request.

For the carbon emissions, I am relying on [a report from the International Energy Agency (IEA)](https://www.iea.org/reports/electricity-2026/emissions), estimating the global electricity carbon footprint at about 435 gCO₂/kWh in 2025. The US not having a good reputation for clean energy, that will be a good lower bound.

Now let’s do the maths. I need each of these references at the token unit. For the electricity, I have 0.3 Wh per request. Let’s consider a request averaging 500 tokens. Therefore I have:

$$
\frac{0.3}{500} = 0.0006\ \text{Wh per token}.
$$

For water consumption, we said we had 30 requests for 500 mL of water for a request of 0.004 kWh. We assumed that our request was 0.3 Wh instead from the EpochAI estimate. That’s:

$$
\frac{500}{30} = 16.667\ \text{mL per request}
$$

and so this is:

$$
\frac{16.667}{500} = 0.0333\ \text{mL per token at }0.004\ \text{kWh}.
$$

So in our case that is:

$$
0.0333 \cdot \frac{0.3}{4} = 0.0024975\ \text{mL per token}.
$$

Now moving on to the carbon footprint. I have 0.0006 Wh per token and 435 gCO₂/kWh. So for one token I have:

$$
\frac{0.0006 \cdot 435}{1000} = 0.000261\ \text{gCO}_2.
$$

Great!, now is the time to summarize all this for my 26.4B tokens. I am going to assume they are all the same kind of tokens whether input, cached or output since I don't have access to the full distribution. That's quite a bad estimate since these different types of tokens do not require the same resources. But that's fine, let's stick with that for our toy example.

$$
\begin{aligned}
\text{Electricity} &: 26{,}400{,}000{,}000 \cdot 0.0006 = 15{,}840{,}000\ \text{Wh}, \\
\text{Water} &: 26{,}400{,}000{,}000 \cdot 0.0024975 = 65{,}934{,}000\ \text{mL}, \\
\text{Carbon} &: 26{,}400{,}000{,}000 \cdot 0.000261 = 6{,}890{,}400\ \text{gCO}_2.
\end{aligned}
$$

Ok. What am I supposed to do with these numbers? Is that a lot? I need some comparison.

Again, I am going to use some sources. From [L’Agence de l'environnement et de la maîtrise de l'énergie (ADEME)](https://agirpourlatransition.ademe.fr/particuliers/economiser/energie/20-solutions-reduire-consommation-electricite), the french public agency for the ecological transition, we can read that a 5 minute shower is roughly 35L of water. From [the same agency](https://impactco2.fr/outils/transport) we can read that 100 km in a thermic car emits roughly 14.2 kgCO₂. Lastly, and still using the [same agency data](https://carlabelling.ademe.fr/fiche/1273/kia-ev3-earth-autonomie-standard-204ch-58.3-kwh), we have a minimum energy consumption for an EV car (from the brand Kia) of 149 Wh / km.

This means that instead of using codex, I could have took:

$$
\frac{65{,}934{,}000}{35{,}000} = 1{,}883.829\ \text{showers}.
$$

I could have also drove:

$$
\frac{15{,}840{,}000}{149} = 106{,}308.725\ \text{km in a EV car}.
$$

Lastly, it polluted as much as someone driving a thermic car for a distance of:

$$
\left(\frac{6{,}890{,}400}{14{,}200}\right) \cdot 100 = 48{,}523.944\ \text{km}.
$$

I don’t know about you, but these numbers are concerning to me. Again these are estimates. But we only took a subset of the full impact. We occulted training, making chips, all the other AI usage outside codex and so much more.

Per [this study](https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2011-WaterFootprintCrops.pdf), we have that 1 kg of avocado is worth 1981 L of water consumed. So my codex usage was worth $$65{,}934 / 1{,}981 = 33{.}28$$ kg of avocadoes.

Because I am now involved in this blog post, what about the guacamole equivalent?


[Wikipedia](https://en.wikipedia.org/wiki/Avocado) says the pear-shaped fruit "weighs between 100 and 1,000 g". Let's say I am taking one solid 500g avocado per guacamole. That's $$33{.}28 / 0{.}5 = 66{.}56$$ guacomoles.

AI agents, guacomole, both or nothing at all: at least now you and me are making conscious choices.

## Sources

- [1] [https://en.wikipedia.org/wiki/Avocado](https://en.wikipedia.org/wiki/Avocado)
- [2] [https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use)
- [3] [https://arxiv.org/html/2304.03271v4](https://arxiv.org/html/2304.03271v4)
- [4] [https://www.iea.org/reports/electricity-2026/emissions](https://www.iea.org/reports/electricity-2026/emissions)
- [5] [https://agirpourlatransition.ademe.fr/particuliers/economiser/energie/20-solutions-reduire-consommation-electricite](https://agirpourlatransition.ademe.fr/particuliers/economiser/energie/20-solutions-reduire-consommation-electricite)
- [6] [https://impactco2.fr/outils/transport](https://impactco2.fr/outils/transport)
- [7][https://carlabelling.ademe.fr/fiche/1273/kia-ev3-earth-autonomie-standard-204ch-58.3-kwh](https://carlabelling.ademe.fr/fiche/1273/kia-ev3-earth-autonomie-standard-204ch-58.3-kwh)
- [8] [https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2011-WaterFootprintCrops.pdf](https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2011-WaterFootprintCrops.pdf)
