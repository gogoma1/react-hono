import { CompletionContext, snippet } from "@codemirror/autocomplete";
import { markdownLanguage } from "../markdown-parser/markdown";
import { TEX_LANGUAGE } from "../markdown-parser/consts";
import autoCompletions, { AutoCompleteMode } from "./auto-completions";
import { type Extension } from "@codemirror/state";

const isAtInlineMath = (line: string, cur: number) => {
  const ahead = line.substring(0, cur);
  const openTagExists = ahead.lastIndexOf("\\)") < ahead.lastIndexOf("\\(");
  
  const closeTagBehind = line.indexOf("\\)", cur);
  const openTagBehind = line.indexOf("\\(", cur);
  const closeTagExists = (closeTagBehind === -1 ? Infinity : closeTagBehind) < 
    (openTagBehind === -1 ? Infinity : openTagBehind);
  
  return openTagExists && closeTagExists;
};

const configureMmdAutoCompleteForCodeMirror = (extensions: Extension[]) => {
  const mmdACSource = (context: CompletionContext) => {
    const word = context.matchBefore(/(\\[\w\[\{\(\*]*)/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }
    const atLineStart: boolean = Boolean(context.matchBefore(/^(\\[\w\[\{\(\*]*)/));
    const line = context.state.doc.lineAt(context.pos);
    const cur = context.pos - line.from;
    const atInlineMath = isAtInlineMath(line.text, cur);

    const options: unknown[] = [];
    atLineStart && autoCompletions.delimiters[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 80 + item.rank });
    });
    atInlineMath || autoCompletions.delimiters[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 80 });
    });
    atLineStart && autoCompletions.latexOperators[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 70 });
    });
    atLineStart && autoCompletions.textLatexCommands[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 60 });
    });
    atInlineMath || autoCompletions.textLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 50 });
    });
    atInlineMath && autoCompletions.mathLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template) });
    });
    return {
      from: word.from,
      options
    };
  };

  const latexACSource = (context: CompletionContext) => {
    let word = context.matchBefore(/(\\[\w\{]*)/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }
    const endOfDoubleBackslash = context.matchBefore(/(\\\\)/);
    if (endOfDoubleBackslash) {
      return null;
    }
    const atLineStart: boolean = Boolean(context.matchBefore(/^(\\[\w\{]*)/));

    const options: unknown[] = [];
    atLineStart && autoCompletions.latexOperators[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 10 });
    });
    autoCompletions.mathLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template) });
    });
    return {
      from: word.from,
      options
    };
  };

  extensions.push(markdownLanguage.data.of({
    autocomplete: mmdACSource,
    closeBrackets: { brackets: ["'", '"'] }
  }));
  extensions.push(TEX_LANGUAGE.data.of({
    autocomplete: latexACSource
  }));
};

export default configureMmdAutoCompleteForCodeMirror
