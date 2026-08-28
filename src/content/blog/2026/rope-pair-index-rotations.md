---
title: "RoPE: How to find the pair index that rotates N times"
description: "Finding the pair index whose RoPE frequency makes N rotations over the sequence length."
pubDatetime: 2026-08-28T12:00:00+02:00
tags: ["Post"]
heroImage: /assets/img/2026/rope-pair-index-rotations/rope-hero.svg
draft: false
unlisted: false
---

When encoding the position information with RoPE, the dimension of our vector is split into pairs, and each pair is going to rotate with a different frequency. For the pair index $i$, the associated frequency is

$$
\omega_i = \frac{1}{\mathrm{base}^{2i/d}}
$$

We usually take a base of 10,000.

If we note the sequence length $L$, this gives a total angle of $L\omega_i$. This is the total angle by which this pair is going to rotate over the sequence length.

Now say that you want to find the specific pair whose RoPE frequency rotates by N rotations over the sequence length. How do you compute that?

Since one rotation is $$2\pi$$ then the number of rotations N for the pair index $i$ over the sequence length is

$$
N = \frac{L\omega_i}{2\pi}
$$

Thus, we get the following 

$$
N = \frac{L\omega_i}{2\pi}
$$

$$
\Leftrightarrow\quad
N = \frac{L}{2\pi}\cdot\frac{1}{\mathrm{base}^{2i/d}}
$$

$$
\Leftrightarrow\quad
\frac{2i}{d}\ln(\mathrm{base})
=
\ln\left(\frac{L}{2\pi N}\right)
$$

$$
\boxed{
i =
\frac{d}{2}\cdot
\frac{\ln\left(\frac{L}{2\pi N}\right)}
     {\ln(\mathrm{base})}
}
$$

This is the pair $i$ whose RoPE frequency makes $N$ rotations over the sequence length. But why would we compute this at all? 

This can be useful to identify the dimension pairs performing many or few rotations and thus use methods like YaRN accordingly. But that's another blog post :)
