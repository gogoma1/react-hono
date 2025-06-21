import {
  blockDelimiters,
  inlineDelimiters,
  blockLatexOperators,
  inlineTextLatexCommands,
  blockTextLatexCommands,
  inlineMathLatexCommands,
} from "./dictionary";

import { AutoCompleteMode } from "./dictionary";

export { AutoCompleteMode, AutoCompleteEnv } from "./dictionary";

const autoCompletions = {
  delimiters: {
    [AutoCompleteMode.BLOCK]: blockDelimiters,
    [AutoCompleteMode.INLINE]: inlineDelimiters,
  },

  latexOperators: {
    [AutoCompleteMode.BLOCK]: blockLatexOperators,
  },

  /** LaTeX commands in Text mode/environment */
  textLatexCommands: {
    [AutoCompleteMode.BLOCK]: blockTextLatexCommands,
    [AutoCompleteMode.INLINE]: inlineTextLatexCommands,
  },

  /** LaTeX commands in Math mode/environment */
  mathLatexCommands: {
    [AutoCompleteMode.INLINE]: inlineMathLatexCommands,
  },
};
export default autoCompletions;
