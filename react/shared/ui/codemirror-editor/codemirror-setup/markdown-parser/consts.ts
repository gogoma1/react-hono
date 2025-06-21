import { tags, Tag } from "@lezer/highlight";
import { StreamLanguage } from "@codemirror/language";
import { stexMath } from "@codemirror/legacy-modes/mode/stex";

export const MATH_BLOCK_START_REGEX = /^(?:\s*[>]\s*)?\$\$/; // (?:[>]\s*)?: Optionally allow block math lines to start with '> '
export const MATH_BLOCK_STOP_REGEX = /\$\$\s*$/;
export const MULTI_MATH_START_REGEX = /^(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const MULTI_MATH_START_REGEX_G = /(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const EQUATION_MATH_START_REGEX = /^(?:\\begin\{([^}]*)\})/;
export const regExpMultiMath = /(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const imageRegex = /!\[.*?\]\((?<url>.*?)\)/;

export const DOLLAR_SIGN_CHAR_CODE = 36;
export const BACKSLASH_CHAR_CODE = 92;

export const TEX_LANGUAGE = StreamLanguage.define(stexMath);

export const EQUATION_MATH_NOT_NUMBER = "EquationMathNotNumber"; //equation_math_not_number 
export const EQUATION_MATH = "EquationMath"; //equation_math 
export const REFERENCE_NOTE = "ReferenceNote"; //reference_note
export const BLOCK_DISPLAY_MATH = "BlockDisplayMath";
export const INLINE_DISPLAY_MATH = "InlineDisplayMath";

export const BLOCK_MATH = 'BlockMath';
export const BLOCK_MATH_CONTENT_TAG = 'BlockMathContent';

export const BLOCK_MULTI_MATH = "BlockMultiMath";
export const BLOCK_MULTI_MATH_CONTENT_TAG = 'BlockMultiMathContent';
export const BLOCK_TEXT_LATEX_CONTENT_TAG = 'BlockTextLatexContent';
export const BLOCK_MULTI_MATH_DELIMITER = 'BlockMultiMathDelimiter';
export const BLOCK_MULTI_MATH_VERBOSE_DELIMITER = 'BlockMultiMathVerboseDelimiter'; // \begin{...}, \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_COMMAND = 'BlockMultiMathDelimiterCommand'; // For `\begin`, `\end` in \begin{...} \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_BRACE = 'BlockMultiMathDelimiterBrace'; // For `{`, `}` in \begin{...} \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_TYPE = 'BlockMultiMathDelimiterType'; // For ... in \begin{...} \end{...}

export const BLOCK_TABLE = 'BlockTable';
export const BLOCK_CENTER = 'BlockCenter';
export const BLOCK_LEFT = 'BlockLeft';
export const BLOCK_RIGHT = 'BlockRight';

export const BLOCK_TABULAR = 'BlockTabular';
export const BLOCK_FIGURE = 'BlockFigure';
export const BLOCK_LIST = 'BlockList';
export const BLOCK_ABSTRACT = 'BlockAbstract';
export const BLOCK_THEOREM = 'BlockTheorem';
export const BLOCK_TEXT = 'BlockText';

export const INLINE_MATH = 'InlineMath'; //inline_math
export const INLINE_MATH_CONTENT_TAG = 'InlineMathContent';
export const INLINE_MATH_START_DELIMITER = 'InlineMathStartDelimiter';
export const INLINE_MATH_STOP_DELIMITER = 'InlineMathStopDelimiter';

export const INLINE_MULTI_MATH = 'InlineMultiMath';
export const INLINE_MULTI_MATH_CONTENT_TAG = 'InlineMultiMathContent';
export const INLINE_MULTI_MATH_START_DELIMITER = 'InlineMultiMathStartDelimiter';
export const INLINE_MULTI_MATH_STOP_DELIMITER = 'InlineMultiMathStopDelimiter';

export const INLINE_IMAGE_PARAMS = 'ImageParams';

export const mathTag = Tag.define(tags.keyword);
export const latexTag = Tag.define(tags.tagName);
export const aquaTag = Tag.define(tags.macroName);
export const contentTag = Tag.define(tags.content);
export const delimiterBraceTag = Tag.define(tags.contentSeparator);

export const inlineMathTag = Tag.define(mathTag);
export const inlineMathTagDelimiter = Tag.define(tags.keyword);

export const FOLDE_BLOCKS = [
  BLOCK_MULTI_MATH,
  BLOCK_DISPLAY_MATH,
  BLOCK_MATH,
  EQUATION_MATH_NOT_NUMBER,
  EQUATION_MATH
];

export const latexEnvironments = [
  "figure",
  "table",
  "tabular",
  "enumerate",
  "itemize",
  "center",
  "left",
  "right",
];

/** https://docs.mathjax.org/en/v3.0-latest/input/tex/macros/index.html#environments */
export const mathEnvironments = [
  "align",
  "align*",
  "alignat",
  "alignat*",
  "aligned",
  "alignedat",
  "array",
  "Bmatrix",
  "bmatrix",
  "cases",
  "eqnarray",
  "eqnarray*",
  "equation",
  "equation*",
  "gather",
  "gather*",
  "gathered",
  "matrix",
  "multline",
  "multline*",
  "pmatrix",
  "smallmatrix",
  "split",
  "subarray",
  "Vmatrix",
  "vmatrix"
];

export const reNewTheorem: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}/;
export const reNewTheoremG: RegExp = /\\newtheorem([^}]*)\s{0,}\{(?<name>[^}]*)\}/
export const reNewTheoremNumbered: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}\s{0,}\[(?<numbered>[^\]]*)\]/;
export const reNewTheoremNumbered2: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\[(?<numbered>[^\]]*)\]\s{0,}\{(?<print>[^}]*)\}/;
export const reNewTheoremUnNumbered: RegExp = /^\\newtheorem\*\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}/;
export const reTheoremStyle: RegExp = /^\\theoremstyle\s{0,}\{(definition|plain|remark)\}/;
export const reTheoremStyleG: RegExp = /\\theoremstyle\s{0,}\{(definition|plain|remark)\}/;
export const reNewCommandQedSymbol: RegExp = /^\\renewcommand\s{0,}\\qedsymbol\s{0,}\{(?<qed>[^}]*)\}/;
export const reNewCommandQedSymbolG: RegExp = /\\renewcommand\s{0,}\\qedsymbol\s{0,}\{(?<qed>[^}]*)\}/;
export const reSetCounter: RegExp = /^\\setcounter\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<number>[^}]*)\}/;
export const reSetCounterG: RegExp = /\\setcounter\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<number>[^}]*)\}/;
export const reLatexFootnotes: RegExp = /^\\(?:footnotemark|footnotetext|footnote|blfootnotetext)/;
export const reNumber = /^-?\d+$/;

export const textLatexCommands = [
  "\\title",
  "\\author",
  "\\section",
  "\\section*",
  "\\subsection",
  "\\subsection*",
  "\\subsubsection",
  "\\subsubsection*",
  "\\pagebreak",
  "\\eqref",
  "\\ref",
  "\\label",
  "\\theoremstyle",
  "\\setcounter",
  "\\newtheorem*",
  "\\newtheorem",
  "\\renewcommand",
  "\\qedsymbol",
  "\\footnotemark",
  "\\footnotetext",
  "\\footnote",
  "\\footnotetext",
  "\\textit",
  "\\textbf",
  "\\texttt",
  "\\text",
  "\\underline",
  "\\uline",
  "\\uuline",
  "\\uwave",
  "\\dashuline",
  "\\dotuline",
  "\\sout",
  "\\xout",
];
