import type InputManager from './InputManager';

const header1 = /^\n?.*\n-*\n?$/;
const header2 = /^\n?.*\n=*\n?$/;

const unapplyHeader = (text: string): string => (
  text.replace(/\n?(-|=)*\n?$/, '')
    .split('\n').join(' ').trim()
);

const applyHeader = (text: string, dash: string): string => {
  const headerTitle = unapplyHeader(text);
  const headerBar = new Array(headerTitle.length).fill(dash).join('');
  return headerTitle + '\n' + headerBar + '\n';
};

const unapplyList = (text: string): string => (
  text.split('\n')
    .map(line => line.replace(/^ ([0-9]+\.|-) /, '')).join('\n')
);

interface Feature {
  match: RegExp;
  apply: (text: string) => string;
  unapply: (text: string) => string;
  multiline: boolean;
}

export function checkApply (name: string, text: string): string {
  const features: Record<string, Feature> = {
    bold: {
      match: /^\*{2}.*\*{2}$/,
      apply: text => `**${text}**`,
      unapply: text => text.substring(2, text.length - 2),
      multiline: false
    },
    italic: {
      match: /^\*.*\*$/,
      apply: text => `*${text}*`,
      unapply: text => /^\*{2}[^*]*\*{2}$/.test(text)
        ? `*${text}*` : text.substring(1, text.length - 1),
      multiline: false
    },
    quote: {
      match: /^(> .*\n)*> .*\n?$/,
      apply: text => text.split('\n').map(line => `> ${line}`).join('\n'),
      unapply: text => text.split('\n').map(line => line.substring(2)).join('\n'),
      multiline: true
    },
    code: {
      match: /^( {4}.*\n)* {4}.*\n?$/,
      apply: text => text.split('\n').map(line => `    ${line}`).join('\n'),
      unapply: text => text.split('\n').map(line => line.substring(4)).join('\n'),
      multiline: true
    },
    nlist: {
      match: /^( [0-9]+\. .*\n)* [0-9]+\. .*\n?$/,
      apply: text => unapplyList(text).split('\n')
        .map((line, k) => ` ${k + 1}. ${line}`).join('\n'),
      unapply: unapplyList,
      multiline: true
    },
    dlist: {
      match: /^( - .*\n)* - .*\n?$/,
      apply: text => unapplyList(text).split('\n')
        .map(line => ` - ${line}`).join('\n'),
      unapply: unapplyList,
      multiline: true
    },
    header: {
      match: header2,
      apply: text => header1.test(text) // If already header 1
        ? applyHeader(text, '=') // then make it a header 2
        : applyHeader(text, '-'), // otherwise make it a header 1
      unapply: unapplyHeader,
      multiline: true
    }
  };

  if (name in features) {
    const feature = features[name];
    const target = feature.multiline
      ? text
      : text.split('\n').join(' ');

    if (feature.match.test(target)) {
      return feature.unapply(text);
    } else {
      return feature.apply(text);
    }
  } else {
    return text;
  }
}

declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}

interface MarkedValue {
  value: string;
  token: string;
}

function markSelection (input: InputManager): MarkedValue {
  // Store old value
  const value: string = input.getValue();
  const select: Record<string, number> = input.getSelect();
  // Generate and replace select with token (overkill)
  const token: string = crypto.randomUUID();
  return {
    value: value.slice(0, select.start) + token +
    value.slice(select.end),
    token: token
  };
}

function unmarkSelection (input: InputManager, marked: MarkedValue): void {
  const selectText: string = input.getSelectText();
  const selectStart: number = marked.value.indexOf(marked.token);
  input.setValue(marked.value.replace(marked.token, selectText));
  input.setSelect(selectStart, selectStart + selectText.length);
}

interface Line {
  val: string;
  num: number;
}

export function addReference (input: InputManager, reference: string): number {
  // Mark selection
  const marked: MarkedValue = markSelection(input);

  // Get link list
  const lines: Array<Line> = marked.value.split('\n')
    .map((i, k) => ({ val: i, num: k }));
  const links: Array<Line> = lines
    .filter(line => /^\s*\[[0-9]*\]:.*$/.test(line.val));

  // Extract links from lines & make new link id
  const newLines: Array<Line> = lines
    .filter(line => !links.includes(line));
  const newLinkID: number = links.length + 1;
  const newLinkText = `  [${newLinkID}]: ${reference}`;

  // Create new value
  unmarkSelection(input, {
    value: [
      ...newLines, // Main content
      ...links, // Links
      { val: newLinkText, num: -1 } // Added link
    ].map(i => i.val).join('\n'),
    token: marked.token
  });

  return newLinkID;
}
