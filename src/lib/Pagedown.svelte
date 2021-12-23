<script lang="ts">
  import { onMount } from 'svelte';
  import ButtonBar from './ButtonBar.svelte';
  import Popup, { PopupButton } from './Popup.svelte';
  import InputManager from './InputManager';
  import { addReference, checkApply } from './MarkdownTools';
  
  let popup: Popup;
  let buttonBar: ButtonBar;
  let textbox: InputManager;
  let textarea: HTMLTextAreaElement;
  let undoDisabled: boolean;
  let redoDisabled: boolean;
  let popupShowing = false;

  function applyButton (name: string): () => void {
    return (): void => (
      textbox.setSelectText(
        checkApply(name, textbox.getSelectText()), true)
    );
  }
  
  const buttonClicks: Record<string, () => void> = {
    bold: applyButton('bold'),
    italic: applyButton('italic'),
    link: () => {
      popup.show('link');
      popupShowing = popup.isShowing();
    },
    image: () => {
      popup.show('image');
      popupShowing = popup.isShowing();
    },
    quote: applyButton('quote'),
    code: applyButton('code'),
    nlist: applyButton('nlist'),
    dlist: applyButton('dlist'),
    header: applyButton('header'),
    bar: () => textbox.setSelectText('\n\n----------\n\n', true),
    undo: () => textbox.undo(),
    redo: () => textbox.redo()
  };
  
  function addLink (): void {
    const refID: number = addReference(textbox, popupLink.value);
    textbox.setSelectText(`[${textbox.getSelectText()}][${refID}]`, true);
    hidePopup();
  }
  
  function addImage (): void {
    const refID: number = addReference(textbox, popupImage.value);
    textbox.setSelectText(`![${textbox.getSelectText()}][${refID}]`, true);
    hidePopup();
  }

  function hidePopup (): void {
    popupLink.value = 'https://';
    popupImage.value = 'https://';
    popupShowing = false;
    popup.hide();
    buttonBar.uncheck();
  }
  
  const popupLink: PopupButton = {
    add: addLink,
    cancel: hidePopup,
    value: 'https://'
  };
  
  const popupImage: PopupButton = {
    add: addImage,
    cancel: hidePopup,
    value: 'https://'
  };

  let listener: () => void = () => { return; };
  export function setListener (newListener: () => void): void {
    listener = newListener;
  }
  
  export function getValue (): string {
    return textbox.getValue();
  }
  
  export function setValue (text: string): void {
    return textbox.setValue(text);
  }

  onMount((): void => {
    textbox = new InputManager(textarea);
    textbox.setListener(function () {
      undoDisabled = !textbox.canUndo();
      redoDisabled = !textbox.canRedo();
      listener();
    });
  });
</script>

<aside class="pagedown-editor">
  <ButtonBar
    buttons={buttonClicks}
    undoDisabled={undoDisabled}
    redoDisabled={redoDisabled}
    bind:this={buttonBar} />
  <Popup
    link={popupLink}
    image={popupImage}
    bind:this={popup} />
  <textarea
    class="pagedown-textarea"
    bind:this={textarea}
    disabled={popupShowing}></textarea>
</aside>

<style>
  :root {
    --base-border: rgb(186, 191, 196);
  }
  
  :global(.pagedown-editor) {
    position: relative;
    text-align: left;
  }
  
  :global(.pagedown-textarea) {
    position: relative;
    padding: 1em;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 300px;
    border: none;
    border-top: solid 1px var(--base-border);
    resize: vertical;
    font-family: ui-monospace,"Cascadia Mono","Segoe UI Mono",
                 "Liberation Mono",Menlo,Monaco,Consolas,monospace;
    border: solid 1px var(--base-border);
    border-radius: 0 0 3px 3px;
  }

  .pagedown-textarea:focus {
    outline: 0;
  }
</style>
