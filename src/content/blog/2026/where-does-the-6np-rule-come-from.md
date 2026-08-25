---
title: "Where does the 6NP rule come from?"
description: "The 6NP rule is a shortcut for estimating how many floating-point operations are needed to train a dense neural network."
pubDatetime: 2026-08-25T12:00:00+02:00
tags: ["Post"]
heroImage: /assets/img/2026/6NP/Screenshot 2026-08-25 at 2.20.14 PM.png
draft: false
unlisted: false
---

The 6NP rule is a shortcut for estimating how many floating-point operations are needed to train a dense neural network. It can be summarized like so:

$$
\text{Training FLOPs} \approx 6 \times \text{parameters} \times \text{tokens}
$$

In this blog post we are going to walk our way through understanding where does this simple rule come from.

Let's define $N$ as the number of trainable parameters and $P$ the number of tokens processed during training.

## 1) What is a FLOP?

A FLOP is a floating-point operation. For instance $a \times b + c$ is one multiplication followed by one addition. This counts as 2 FLOPs.

## 2) Forward pass

Consider our network such that

$$
y = \sum_i w_i x_i.
$$

So for every weight $w_i$, we do:

$$
\mathrm{accumulator}
\leftarrow
\underbrace{\mathrm{accumulator} +}_{\text{1 addition}}
\underbrace{w_i x_i}_{\text{1 multiplication}}
$$

Therefore we have 2 FLOPs per weight. Now let's try to find back this result but using matrix multiplications instead.

Let's consider a linear layer:

$$
Y = XW
\qquad
\text{with } W \in \mathbb{R}^{d_{\mathrm{in}} \times d_{\mathrm{out}}}.
$$

The number of parameters in $W$ is

$$
N_W = d_{\mathrm{in}} \cdot d_{\mathrm{out}}.
$$

Let's consider one token $x \in \mathbb{R}^{d_{\mathrm{in}}}$ from $X$. We have $y = xW$. In this operation we have $d_{\mathrm{out}}$ outputs and each one of these outputs require a dot product involving $d_{\mathrm{in}}$ values.

So the cost for one token is

$$
2d_{\mathrm{in}}d_{\mathrm{out}} = 2N_W.
$$

Hence the forward FLOPs per token is $2N_W$.

However we have to remember that training involves two stages : forward $\to$ loss $\to$ backward

The forward pass computes the prediction. The backward pass helps us understand how should parameters change to improve our prediction.

## 3) Backward pass

During the forward prediction we had $Y = XW$. Now during backprop we want to compute

$$
\frac{\partial L}{\partial X}
\qquad\text{and}\qquad
\frac{\partial L}{\partial W}.
$$

This is what is going to tell us how our loss change with respect to the inputs and the parameters.

The gradient with respect to the inputs is

$$
\frac{\partial L}{\partial X}
=
\frac{\partial L}{\partial Y} W^\top
$$

while the gradient with respect to the weights is

$$
\frac{\partial L}{\partial W}
=
X^\top \frac{\partial L}{\partial Y}.
$$

So for the backpropagation step we have two more matrix multiplications. So we have

$$
\text{forward: } XW
\qquad;
\text{backward: } \frac{\partial L}{\partial Y} W^\top
\qquad;
\text{backward: } X^\top \frac{\partial L}{\partial Y}.
$$

Each matrix costs $2N$ FLOPs like we saw before.

So for one token

$$
\underbrace{2N}_{\text{forward}}
+
\underbrace{2N}_{\text{gradient wrt activations}}
+
\underbrace{2N}_{\text{gradient wrt weights}}
= 6N.
$$

And now process $P$ tokens instead of one and you get $6NP$. Next time you will hear about that rule, you will know the reason why :)
