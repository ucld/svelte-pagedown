# Svelte Pagedown

Re-implementation of [WMD/Pagedown](https://github.com/StackExchange/pagedown)'s editor to learn [Svelte](https://svelte.dev/) & [Typescript](https://www.typescriptlang.org/).

[**Demo**](https://ucld.github.io/svelte-pagedown/)

## Development

To install: ``npm run ci``

To run development server: ``npm run dev``

To build for web: ``npm run build:web``

To build it as a package: ``npm run package``

## Usage in projects

You can install the package with:

``npm install svelte-pagedown``

And use it as:

```html
<script lang="ts">
  import Pagedown from 'svelte-pagedown'

  let pagedown: Pagedown;
</script>

<Pagedown bind:this={pagedown} />
```

**NOT TO BE USED IN PRODUCTION**

There are plenty of good editors that are not made for educational purposes:

* [Stacks](https://github.com/StackExchange/Stacks-Editor/)
* [ProseMirror](http://prosemirror.net/)

## Usage in browser

Builds are available on the [releases page](https://github.com/ucld/svelte-pagedown/releases/):

```html
<script type="module" src="pagedown.es.js"></script>
<!-- OR -->
<script src="pagedown.umd.js"></script>

<link rel="stylesheet" href="pagedown.css">
```

Both expose the `Pagedown` component on `window.Pagedown`, which can be called as:

```html
<div id="editor"></div>
<script>
  const pagedown = new Pagedown({
    target: document.querySelector('#editor')
  })
</script>
```

The pagedown object has the following properties:

* `.getValue(): string`, which gets the current value of the editor.
* `.setValue(value: string): void`, which sets the current value of the editor.
* `.setListener(listener: () => void): void`, which sets an `.oninput` listener.

## Bugs

* Undoing then, selecting/moving erases redo history.
  * Similar bug in original Pagedown, except redo then undo erases history.  
    Due to using "modes" instead of some atomic "transactions" for undo history.
* Blockquotes, code, lists, etc should appear on newline.
  * Something the original Pagedown is much better at.
