Pagedown
========

This is a [StackExchange][1]-like [Markdown][2] + [$\LaTeX$][3] editor, using [markdown-it][4].

[StackExchange's allowed HTML tags][5] have not been implemented.

#### Spoilers

Spoilers use a reddit-like syntax:

```
>! This is a spoiler
```

Renders as:

>! This is a spoiler

#### Tables

[Github-flavored markdown tables][6] syntax:

```
| A header | Another header |
| -------- | -------------- |
| First    | row            |
| Second   | row            |
```

Renders as:

| A header | Another header |
| -------- | -------------- |
| First    | row            |
| Second   | row            |

And alignment:

```
| left | center | right |
|:---- |:------:| -----:|
| One  | Two    | Three |
```

Renders as:

| left | center | right |
|:---- |:------:| -----:|
| One  | Two    | Three |

#### LaTeX

Equations rendered using [MathJax][7]:

```
The equation $3x^2 + 5x +1 = 0$ has the solutions

$$
x_{1,2} = \frac{-5 \pm \sqrt{5^2-12}}{6}
$$
```

Renders as:

The equation $3x^2 + 5x +1 = 0$ has the solutions

$$
x_{1,2} = \frac{-5 \pm \sqrt{5^2-12}}{6}
$$


  [1]: https://stackexchange.com/
  [2]: https://en.wikipedia.org/wiki/Markdown
  [3]: https://en.wikipedia.org/wiki/LaTeX
  [4]: https://markdown-it.github.io/markdown-it/
  [5]: https://meta.stackexchange.com/questions/1777/what-html-tags-are-allowed-on-stack-exchange-sites
  [6]: https://github.github.com/gfm/#tables-extension-
  [7]: https://mathjax.org
