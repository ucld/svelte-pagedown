<script lang="ts">
  import wmdButtons from './wmd-buttons.svg'

  let current : HTMLInputElement | null = null;
  export let buttons: Record<string, () => void>;
  export let undoDisabled = true;
  export let redoDisabled = true;
  export function uncheck (): void {
    current.checked = false;
    current = null;
  }
  
  function handleCheck (name: string): () => void {
    return function (): void {
      // If clicking the same, then uncheck
      if (current === this) {
        uncheck();
      } else {
        current = this;
      }
      buttons[name]();
    };
  }

  function handleClick (name: string): (evt: MouseEvent) => void {
    return function (evt): void {
      evt.preventDefault();
      (evt.target as HTMLInputElement).checked = false;
      if (current === null) {
        buttons[name]();
      }
    };
  }

  const buttonProps: Record<string, string> = {
    type: 'radio',
    class: 'pagedown-bar-button',
    name: 'buttonBar'
  };

  // A bit hacky
  const btnStyle = `background-image: url(${wmdButtons}); background-position-x`;
</script>

<main>
  <input on:click={handleClick('bold')} style={`${btnStyle}: 0`} {...buttonProps} />
  <input on:click={handleClick('italic')} style={`${btnStyle}: -20px`} {...buttonProps} />
  <span class="pagedown-bar-spacer"></span>
  <input on:click={handleCheck('link')} style={`${btnStyle}: -42px`} {...buttonProps} />
  <input on:click={handleClick('quote')} style={`${btnStyle}: -60px`} {...buttonProps} />
  <input on:click={handleClick('code')} style={`${btnStyle}: -80px`} {...buttonProps} />
  <input on:click={handleCheck('image')} style={`${btnStyle}: -101px`} {...buttonProps} />
  <span class="pagedown-bar-spacer"></span>
  <input on:click={handleClick('nlist')} style={`${btnStyle}: -120px`} {...buttonProps} />
  <input on:click={handleClick('dlist')} style={`${btnStyle}: -140px`} {...buttonProps} />
  <input on:click={handleClick('header')} style={`${btnStyle}: -160px`} {...buttonProps} />
  <input on:click={handleClick('bar')} style={`${btnStyle}: -180px`} {...buttonProps} />
  <span class="pagedown-bar-spacer"></span>
  <input
    on:click={handleClick('undo')}
    style={`${btnStyle}: -200px`}
    disabled={undoDisabled}
    {...buttonProps} />
  <input
    on:click={handleClick('redo')}
    style={`${btnStyle}: -220px`}
    disabled={redoDisabled}
    {...buttonProps} />
</main>

<style>
  :root {
    --base-border: rgb(186, 191, 196);
  }
  
  main {
    position: relative;
    background: white;
    box-sizing: border-box;
    border: solid 1px var(--base-border);
    border-radius: 3px 3px 0 0;
    border-bottom: 0;
    width: 100%;
    height: 47px;
    margin: 0;
    margin-bottom: -1px;
    padding: 0 0.5em 0 0.5em;
    overflow-x: auto;
    white-space: nowrap;
    user-select: none;
  }
  
  .pagedown-bar-button {
    position: relative;
    background-position: 0px 0px;
    border-left: solid 4px white;
    border-right: solid 4px white;
    border-top: solid 12px white;
    border-bottom: solid 12px white;
    width: calc(20px + 4px * 2);
    height: calc(20px + 12px + 14px);
    appearance: none;
    -webkit-appearance: none;
    margin: 0px 1px -4px 1px;
  }
  
  .pagedown-bar-button:checked {
    background-position-y: 0px !important;
    box-shadow: 1px 0 0 0 var(--base-border), -1px 0 0 0 var(--base-border),
                100vw calc(-100vw - 1px) 0 100vw rgba(255, 255, 255, 0.5),
                -100vw calc(-100vw - 1px) 0 100vw rgba(255, 255, 255, 0.5);
    pointer-events: auto;
    z-index: 2;
  }
  
  .pagedown-bar-button:hover {
    background-position-y: -40px;
  }
  
  .pagedown-bar-button:disabled {
    background-position-y: -20px !important;
  }

  :global(.pagedown-bar-spacer) {
    display: inline-block;
    width: 20px;
  }
</style>
