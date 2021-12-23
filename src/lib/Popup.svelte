<script lang="ts" context="module">
  export interface PopupButton {
    add: () => void
    cancel: () => void
    value: string
  }
</script>

<script lang="ts">
  import { slide } from 'svelte/transition';
  
  export let image: PopupButton;
  export let link: PopupButton;
  
  let current = '';
  let next = '';

  export function show (name: string): void {
    if (current === '') {
      current = name;
    } else if (current === name) {
      current = '';
    } else {
      current = '';
      next = name;
    }
  }
  
  export function hide (): void {
    show(current);
  }

  export function isShowing (): boolean {
    return next !== '' || current !== '';
  }
  
  function unlock (): void {
    if (next !== '') {
      current = next;
      next = '';
    }
  }
</script>

<main>
  {#if current === 'image'}
    <aside class="pagedown-popup" transition:slide="{{ duration: 100 }}" on:outroend={unlock}>
      <blockquote class="pagedown-notice">
        Images are useful in a post, but
        <strong>make sure the post is still clear without them.</strong>
        If you post images of code or error messages, copy and paste or
        type the actual code or message into the post directly.
      </blockquote>
      <p></p>
      <strong>Insert Image Link</strong>
      <p>
        <input
          type="text"
          class="pagedown-input"
          on:keyup={evt => evt.key === 'Enter' && image.add()}
          bind:value={image.value} />
        <input type="submit" value="Add Image" class="pagedown-button" on:click={image.add} />
        <input
          type="submit"
          value="Cancel"
          class="pagedown-button pagedown-button-empty"
          on:click={image.cancel} />
      </p>
    </aside>
  {:else if current === 'link'}
    <aside class="pagedown-popup" transition:slide="{{ duration: 100 }}" on:outroend={unlock}>
      <strong>Insert Hyperlink</strong>
      <p>
        <input
          type="text"
          class="pagedown-input"
          on:keyup={evt => evt.key === 'Enter' && link.add()}
          bind:value={link.value} />
        <input type="submit" value="Add link" class="pagedown-button" on:click={link.add} />
        <input
          type="submit"
          value="Cancel"
          class="pagedown-button pagedown-button-empty"
          on:click={link.cancel} />
      </p>
    </aside>
  {/if}
</main>

<style>
  :root {
    --base-border: rgb(186, 191, 196);
    --notice-border: rgb(230, 207, 121);
    --notice-background: rgb(253, 247, 226);
    --notice-color: rgb(59, 64, 69);
    --button-border: rgb(63, 93, 122);
    --button-hover: rgb(245, 247, 248);
    --button-color: rgb(15, 53, 89);
  }
  
  main {
    position: absolute;
    width: 100%;
    z-index: 1;
  }

  :global(.pagedown-popup) {
    width: 100%;
    background: white;
    font-family: sans-serif;
    font-size: 0.8em; 
    padding: 16px;
    border: solid 1px var(--base-border);
    box-sizing: border-box;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px,
                rgba(0, 0, 0, 0.05) 0px 1px 4px 0px,
                rgba(0, 0, 0, 0.05) 0px 2px 8px 0px;
  }

  :global(.pagedown-notice) {
    color: var(--notice-color);
    border: solid 1px var(--notice-border);
    background: var(--notice-background);
    border-radius: 3px;
    padding: 16px;
    margin: 0 0 1em 0;
    font-size: 1em;
  }

  :global(.pagedown-input) {
    border: solid 1px var(--base-border);
    border-radius: 3px;
    padding: 0.8em;
    margin-right: 1em;
    width: calc(100% - 16em);
  }

  .pagedown-input:focus {
    outline: 0;
  }

  :global(.pagedown-button) {
    border: solid 1px var(--button-border);
    padding: 0.8em;
    border-radius: 3px;
    background: inherit;
    color: var(--button-color);
  }

  .pagedown-button:hover {
    background-color: var(--button-hover);
  }

  :global(.pagedown-button-empty) {
    border: none;
  }
</style>
