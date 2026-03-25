---
title: "What Is Design of Experiments? Learning It Through a Better Cup of Chai"
description: "Using the perfect cup of chai to understand the fundamentals of Design of Experiments (DOE)"
pubDatetime: 2026-03-25T12:00:00+01:00
heroImage: /assets/img/design-of-experiments.jpeg
tags: ["Post"]
featured: false
layoutStyle: "split"
---


While trying to tackle a problem, you can often tinker with several parameters. Taking the example of LLMs, you could choose to modify the temperature, the prompt strategy (giving a role, giving an example…), switching providers, infer with a different precision (e.g. FP16), and so on. This plenitude of parameters means you need to set a proper structure for your experiments in order to systematically quantify the impact of each parameter. You want to be able to answer questions like: how much better? because of what? relative to what level of noise?

One clean way to do so is to use a full factorial design of experiments. Essentially, it boils down to selecting a set of factors you care about, choosing levels for these factors, and running every combination between them. You can get even better results by repeating each combination several times. This way, you can decompose the total variability into main effects, interactions, and random error.

## An example

Let me walk you through an example.

Suppose you want to optimize the taste of your chai. You decide to study two factors:

- **A**: ginger amount, with two levels: low (-1) and high (+1)
- **B**: simmer time, with two levels: short (-1) and long (+1)

You need a metric to optimize. In our case, let's say that the goal is to maximize a taste score out of 100. In order to account for random error, we repeat each combination three times:

| Ginger (A) | Simmer (B) | Scores | Mean Score |
|---|---|---|---|
| low (-1) | short (-1) | 60, 62, 58 | 60 |
| high (+1) | short (-1) | 70, 72, 68 | 70 |
| low (-1) | long (+1) | 66, 64, 65 | 65 |
| high (+1) | long (+1) | 84, 86, 85 | 85 |

In this case, we have a `2^2` full factorial design with `r = 3` repetitions. Our total number of runs is:

`N = r * 2^k = 3 * 2^2 = 12`

The useful vocabulary here is the following:

- A **factor** is an input you vary.
- A **level** is one of its values.
- A **treatment combination** is one full setting (say high ginger + long simmer time).
- A **main effect** is the average impact of one factor.
- An **interaction** means the effect of one factor depends on another.
- A **replicate** is repeating the same treatment combination; this lets you estimate the noise.

Now let's try to compute the effects of each factor and figure out how to make the best tea in this scenario.

## Step 1): The grand mean

The grand mean is the average response over all runs. In our case, we have:

`\mu = (60 + 70 + 65 + 85) / 4 = 70`

So our overall baseline is 70 out of 100. Our chai is not that bad on average.

## Step 2): Main effects

Now we would like to know the main effects of our factors (the ginger amount and the simmer time here).

The main effect of the ginger amount is the average score with high ginger minus the average score with low ginger:

`\hat{E}_A = (70 + 85) / 2 - (60 + 65) / 2 = 77.5 - 62.5 = 15`

So the way to read this is: increasing the amount of ginger in our chai increases the taste score by 15 points on average.

Likewise, for simmer time we have:

`\hat{E}_B = (65 + 85) / 2 - (60 + 70) / 2 = 75 - 65 = 10`

So a longer simmer improves our chai by 10 points on average.

## Step 3): Interactions

Now you could stop here and draw the hasty conclusion that using more ginger and letting it boil for longer will give you a better drink, end of the story. But does extra ginger help by the same amount regardless of the simmer time?

At short simmer, going from low to high ginger changes the score by `70 - 60 = 10`, while at long simmer, it changes the score by `85 - 65 = 20`. So ginger helps more when the chai simmers longer, and this is what we call an interaction.

A way to think about the interaction is as a difference of differences:

`\hat{E}_{AB} = ((85 - 65) - (70 - 60)) / 2`

The term inside the parentheses compares the ginger effect at long simmer time (`85 - 65`) to the ginger effect at short simmer time (`70 - 60`). So in our case, the interaction effect is:

`\hat{E}_{AB} = ((85 - 65) - (70 - 60)) / 2 = (20 - 10) / 2 = 5`

Dividing by 2 puts the interaction on the same "effect" scale as the main effects in a `2^2` design. Notice that the sign of our interaction is positive; hence, the two factors reinforce each other.

In this toy example, there is only one interaction term because we only have two factors, A and B, so the only possible interaction is AB. More generally, as soon as you add more factors, the number of interaction terms grows. For example, if we introduced a third factor C, say milk amount (low/high), then we would still have the three main effects A, B, and C, but also three second-order interactions AB, AC, and BC, plus one third-order interaction ABC. The second-order interactions tell you whether the effect of one factor depends on another, while the third-order interaction tells you whether a two-factor interaction itself depends on the level of a third factor. For instance, it could be that the ginger–simmer interaction is strong only when the milk amount is high. That is the general logic of factorial designs: they let you capture not only isolated effects, but also how factors combine across multiple levels.

## Step 4): Fitted model

A `2^2` factorial design is usually written as:

`y = \mu + \beta_A * x_A + \beta_B * x_B + \beta_{AB} * x_A * x_B + \varepsilon`

where `x_A, x_B in {-1, +1}`, `\mu` is the grand mean, the `\beta`'s are the coefficients, and `\varepsilon` is the random error. This is the observed value, which includes noise.

Each coefficient is half an effect, and we therefore have:

- `\beta_A = \hat{E}_A / 2 = 15 / 2 = 7.5`
- `\beta_B = \hat{E}_B / 2 = 10 / 2 = 5`
- `\beta_{AB} = \hat{E}_{AB} / 2 = 5 / 2 = 2.5`

So the predicted mean here is:

`\bar{y} = 70 + 7.5 * x_A + 5 * x_B + 2.5 * x_A * x_B`

We can read this as: start at a score of 70, add 7.5 for high ginger, add 5 for long simmer, and add another 2.5 when both happen together.

## Step 5): Variance decomposition

The total variability in the data is measured by the total sum of squares:

`SS_T = sum (y - \mu)^2`

where $y$ is the observed value while $\mu$ is the grand mean.

For this dataset, we have `SS_T = 1070`.

In a replicated full factorial design, this total splits into:

`SS_T = SS_A + SS_B + SS_{AB} + SS_E`

where `SS_A` and `SS_B` are the main-effect contributions, `SS_{AB}` is the interaction contribution, and finally `SS_E` is the random error.

### Error sum of squares

The error comes from the variation between repetitions of the same setting:

`SS_E = sum_replications (y - \bar{y}_r)^2`

where `y` is the observed value while `\bar{y}_r` is the mean over each repetition of this same setting. Here we have:

- First cell: $(60 - 60)^2 + (62 - 60)^2 + (58 - 60)^2 = 8$
- Second cell: $8$
- Third cell: $2$
- Fourth cell: $2$

Hence:

`SS_E = 8 + 8 + 2 + 2 = 20`

This is the part that is not explained by the factors and is the background noise, which will make your chai taste different from one day to another even though you used the same recipe.

### Effects sum of squares

For a balanced `2^k` design with `r` repetitions, each effect sum of squares is:

`SS_effect = r * 2^(k-2) * \hat{E}_effect^2`

Here `k = 2` and `r = 3`, so we have:

- `SS_A = 3 * 2^0 * 15^2 = 675`
- `SS_B = 3 * 2^0 * 10^2 = 300`
- `SS_{AB} = 3 * 2^0 * 5^2 = 75`

And indeed:

`675 + 300 + 75 + 20 = 1070 = SS_T`

And that's all, our variance decomposition is done!

## How to make the best chai?

Now our experiment becomes interpretable:

- ginger: `675 / 1070 = 63.1%`
- simmer time: `300 / 1070 = 28%`
- interaction: `75 / 1070 = 7.0%`
- random error: `20 / 1070 = 1.9%`

And that's it. Chai has no more secrets. The main driver is ginger, then simmer time, then a smaller interaction, and very little noise.

That is much stronger than saying "adding a bit more ginger seems to taste better". Don't you think?
