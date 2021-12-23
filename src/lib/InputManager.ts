class SelfSet {
  #set: Array<SelfSet>;
  #isUniverse: boolean;
  constructor (set: Array<SelfSet>, isUniverse: boolean) {
    this.#isUniverse = isUniverse;
    this.#set = [...set, this];
  }

  contains (other: SelfSet): boolean {
    // If universe, it contains everything
    if (this.#isUniverse) {
      return true;
    } else {
      return this.#set.includes(other);
    }
  }
}

class Mode extends SelfSet {
  shouldSaveOn (newMode: Mode): boolean {
    return !this.contains(newMode);
  }
}

interface InputState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export default class InputManager {
  #element: HTMLTextAreaElement
  #history: Array<InputState>
  #historyPtr: number
  #mode: Mode
  #modes: Record<string, Mode>
  #listener: () => void

  constructor (element: HTMLTextAreaElement) {
    this.#element = element;
    this.#history = [{ value: '', selectionStart: 0, selectionEnd: 0 }];
    this.#historyPtr = 0;
    this.#listener = () => { return; };

    // Modes
    this.#mode = new Mode([], false);
    this.#modes = {
      'Select|Move': this.#mode,
      'Typing': new Mode([this.#mode], false),
      'Delete': new Mode([this.#mode], false),
      'Line|Paste|Cut': new Mode([], true),
      'History': new Mode([], true)
    };

    // Listeners
    this.#element.addEventListener('keydown', this.#inputHandler);
    this.#element.addEventListener('mousedown', this.#inputHandler);
    this.#element.addEventListener('input', () => this.#listener());
  }

  #saveState = (): void => {
    if (this.#historyPtr < this.#history.length - 1) {
      this.#history = this.#history.slice(0, this.#historyPtr + 1);
    }
    this.#history.push({
      value: this.#element.value,
      selectionStart: this.#element.selectionStart,
      selectionEnd: this.#element.selectionEnd
    });
    this.#historyPtr += 1;
  }

  #changeMode = (newModeName: string): void => {
    const newMode: Mode = this.#modes[newModeName];
    console.log('Moving to ', newModeName, this.#mode.shouldSaveOn(newMode))
    if (this.#mode.shouldSaveOn(newMode)) {
      this.#saveState();
    }
    this.#mode = newMode;
  }

  #inputHandler = (evt: MouseEvent | KeyboardEvent): void => {
    if (evt instanceof MouseEvent) {
      this.#changeMode('Select|Move');
    } else if (evt instanceof KeyboardEvent) {
      // Keys down
      const cmdKey: boolean = evt.metaKey || evt.ctrlKey;
      const shfKey: boolean = evt.shiftKey;
      const zKey: boolean = evt.key === 'z' || evt.key === 'Z';
      const yKey: boolean = evt.key === 'y' || evt.key === 'Y';
      const xKey: boolean = evt.key === 'x' || evt.key === 'X';
      const vKey: boolean = evt.key === 'v' || evt.key === 'V';
      const navKey: boolean = [
        'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown'
      ].includes(evt.key);

      // Keys commands
      const backspace: boolean = evt.key === 'Backspace';
      const newLine: boolean = evt.key === 'Enter';
      const tabKey: boolean = evt.key === 'Tab';
      const paste: boolean = cmdKey && vKey;
      const cut: boolean = cmdKey && xKey;
      const redo: boolean = cmdKey && (yKey || (zKey && shfKey));
      const undo: boolean = cmdKey && zKey && !redo;
      const typing: boolean = [...evt.key].length === 1 && !cmdKey;

      // Handle keys
      if (backspace) {
        this.#changeMode('Delete');
      } else if (newLine || paste || cut) {
        this.#changeMode('Line|Paste|Cut');
        this.#changeMode('Typing');
      } else if (undo || redo) {
        evt.preventDefault();
        if ((undo && this.canUndo()) || (redo && this.canRedo())) {
          this.#changeMode('History');
          this.#historyPtr += redo ? 1 : -1;
          Object.assign(this.#element, this.#history[this.#historyPtr]);
        }
      } else if (navKey) {
        this.#changeMode('Select|Move');
      } else if (typing) {
        this.#changeMode('Typing');
      } else if (tabKey) {
        this.#changeMode('Typing');
        evt.preventDefault();
        this.setSelectText('\t', false);
      }

      // Fire listener
      this.#listener();
    }
  }

  public getSelectText (): string {
    return this.#element.value.substring(this.#element.selectionStart, this.#element.selectionEnd);
  }

  public setSelectText (input: string, keepSelect: boolean): void {
    this.#saveState();
    const leftHalf: string = this.#element.value.slice(0, this.#element.selectionStart);
    const rightHalf: string = this.#element.value.slice(this.#element.selectionEnd);
    this.#element.value = leftHalf + input + rightHalf;
    this.#element.selectionEnd = leftHalf.length + input.length;
    this.#element.selectionStart = keepSelect
      ? leftHalf.length
      : this.#element.selectionEnd;
    this.#element.focus();
    this.#listener();
  }

  public getSelect (): { start: number, end: number } {
    return {
      start: this.#element.selectionStart,
      end: this.#element.selectionEnd
    };
  }

  public setSelect (start: number, end: number): void {
    this.#element.selectionStart = start;
    this.#element.selectionEnd = end;
    this.#element.focus();
  }

  public getValue (): string {
    return this.#element.value;
  }

  public setValue (newValue: string): void {
    this.#saveState();
    this.#element.value = newValue;
    this.#listener();
  }

  public setListener (listener: () => void): void {
    this.#listener = listener;
  }

  public undo (): void {
    this.#inputHandler(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
  }

  public redo (): void {
    this.#inputHandler(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
  }

  public canUndo (): boolean {
    return this.#historyPtr - 1 >= 1;
  }

  public canRedo (): boolean {
    return this.#historyPtr + 1 < this.#history.length;
  }
}
