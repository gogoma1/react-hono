export enum AutoCompleteMode {
  BLOCK = 'block',
  INLINE = 'inline'  
};

export enum AutoCompleteEnv {
  MATH = 'math',
  TEXT = 'text'
};

export const blockDelimiters = [
  {
    label: "\\[...\\]",
    template: "\\[\n${}\n\\]",
    mode: AutoCompleteMode.BLOCK,
    rank: 9
  },
  {
    label: "\\begin{equation}...\\end{equation}",
    template: "\\begin{equation}\n${}\n\\end{equation}",
    mode: AutoCompleteMode.BLOCK,
    rank: 8
  },
  {
    label: "\\begin{equation*}...\\end{equation*}",
    template: "\\begin{equation*}\n${}\n\\end{equation*}",
    mode: AutoCompleteMode.BLOCK,
    rank: 7
  }
];

export const inlineDelimiters = [
  {
    label: "\\(...\\)",
    template: "\\(${}\\)",
    mode: AutoCompleteMode.INLINE
  }
];

export const blockLatexOperators = [
  {
    label: "\\begin{tabular}...\\end{tabular}",
    template: "\\begin{tabular}{${}}\n${}\n\\end{tabular}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{array}{}...\\end{array}",
    template: "\\begin{array}{${}}\n${}\n\\end{array}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{subarray}...\\end{subarray}",
    template: "\\begin{subarray}\n${}\n\\end{subarray}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{align}...\\end{align}",
    template: "\\begin{align}\n${}\n\\end{align}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{align*}...\\end{align*}",
    template: "\\begin{align*}\n${}\n\\end{align*}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{split}...\\end{split}",
    template: "\\begin{split}\n${}\n\\end{split}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{gather}...\\end{gather}",
    template: "\\begin{gather}\n${}\n\\end{gather}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{gather*}...\\end{gather*}",
    template: "\\begin{gather*}\n${}\n\\end{gather*}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{itemize}...\\end{itemize}",
    template: "\\begin{itemize}\n\\item ${}\n\\item ${}\n\\end{itemize}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{figure}[h]...\\end{figure}",
    template: "\\begin{figure}[h]\n\\includegraphics[width=0.5\\textwidth, center]{${URL}}\n\\end{figure}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{enumerate}...\\end{enumerate}",
    template: "\\begin{enumerate}\n\\item ${}\n\\end{enumerate}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{aligned}...\\end{aligned}",
    template: "\\begin{aligned}\n${}\n\\end{aligned}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{matrix}...\\end{matrix}",
    template: "\\begin{matrix}\n${}\n\\end{matrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{pmatrix}...\\end{pmatrix}",
    template: "\\begin{pmatrix}\n${}\n\\end{pmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{bmatrix}...\\end{bmatrix}",
    template: "\\begin{bmatrix}\n${}\n\\end{bmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{Bmatrix}...\\end{Bmatrix}",
    template: "\\begin{Bmatrix}\n${}\n\\end{Bmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{vmatrix}...\\end{vmatrix}",
    template: "\\begin{vmatrix}\n${}\n\\end{vmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{Vmatrix}...\\end{Vmatrix}",
    template: "\\begin{Vmatrix}\n${}\n\\end{Vmatrix}",
    mode: AutoCompleteMode.BLOCK
  }
];

export const blockTextLatexCommands = [
  {
    label: "\\section{...}",
    template: "\\section{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  // TODO: uncomment unnumbered sections
  // {
  //   label: "\\section*{...}",
  //   template: "\\section*{${}}",
  //   mode: AutoCompleteMode.BLOCK,
  //   env: AutoCompleteEnv.TEXT
  // },
  {
    label: "\\subsection{...}",
    template: "\\subsection{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  // {
  //   label: "\\subsection*{...}",
  //   template: "\\subsection*{${}}",
  //   mode: AutoCompleteMode.BLOCK,
  //   env: AutoCompleteEnv.TEXT
  // },
  {
    label: "\\subsubsection{...}",
    template: "\\subsubsection{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  // {
  //   label: "\\subsubsection*{...}",
  //   template: "\\subsubsection*{${}}",
  //   mode: AutoCompleteMode.BLOCK,
  //   env: AutoCompleteEnv.TEXT
  // },
  {
    label: "\\title{...}",
    template: "\\title{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\author{...}",
    template: "\\author{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{abstract}...\\end{abstract}",
    template: "\\begin{abstract}\n${}\n\\end{abstract}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{theorem}...\\end{theorem}",
    template: "\\begin{theorem}\n${}\n\\end{theorem}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{lemma}...\\end{lemma}",
    template: "\\begin{lemma}\n${}\n\\end{lemma}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{proof}...\\end{proof}",
    template: "\\begin{proof}\n${}\n\\end{proof}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{corollary}...\\end{corollary}",
    template: "\\begin{corollary}\n${}\n\\end{corollary}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  }
];

export const inlineTextLatexCommands = [
  {
    label: "\\pagebreak",
    template: "\\pagebreak",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\eqref{...}",
    template: "\\eqref{${}}",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },  
  {
    label: "\\ref{...}",
    template: "\\ref{${}}",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\newtheorem{...}{...}",
    template: "\\newtheorem{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\newtheorem*{...}{...}",
    template: "\\newtheorem*{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\setcounter{...}{...}",
    template: "\\setcounter{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\theoremstyle{...}",
    template: "\\theoremstyle{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnote{...}",
    template: "\\footnote{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnotetext{...}",
    template: "\\footnotetext{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnotemark{}",
    template: "\\footnotemark{}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\textit{...}",
    template: "\\textit{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\textbf{...}",
    template: "\\textbf{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\texttt{...}",
    template: "\\texttt{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },  
  {
    label: "\\text{...}",
    template: "\\text{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\underline{...}",
    template: "\\underline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uline{...}",
    template: "\\uline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uuline{...}",
    template: "\\uuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uwave{...}",
    template: "\\uwave{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\dashuline{...}",
    template: "\\dashuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\dotuline{...}",
    template: "\\dotuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\sout{...}",
    template: "\\sout{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\xout{...}",
    template: "\\xout{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  }
];

export const inlineMathLatexCommands = [
  {
    label: "\\AA",
    template: "\\AA",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\aleph",
    template: "\\aleph",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\alpha",
    template: "\\alpha",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\angle",
    template: "\\angle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\approx",
    template: "\\approx",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\asymp",
    template: "\\asymp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\atop",
    template: "\\atop",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\backslash",
    template: "\\backslash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\because",
    template: "\\because",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\beta",
    template: "\\beta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\beth",
    template: "\\beth",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcap",
    template: "\\bigcap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcirc",
    template: "\\bigcirc",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcup",
    template: "\\bigcup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigoplus",
    template: "\\bigoplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigotimes",
    template: "\\bigotimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigvee",
    template: "\\bigvee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigwedge",
    template: "\\bigwedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\boldsymbol",
    template: "\\boldsymbol",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bot",
    template: "\\bot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bowtie",
    template: "\\bowtie",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\breve",
    template: "\\breve",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bullet",
    template: "\\bullet",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cap",
    template: "\\cap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cdot",
    template: "\\cdot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cdots",
    template: "\\cdots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\check",
    template: "\\check",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\chi",
    template: "\\chi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circ",
    template: "\\circ",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circlearrowleft",
    template: "\\circlearrowleft",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circlearrowright",
    template: "\\circlearrowright",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cline",
    template: "\\cline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\complement",
    template: "\\complement",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cong",
    template: "\\cong",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\coprod",
    template: "\\coprod",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cup",
    template: "\\cup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\curlyvee",
    template: "\\curlyvee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\curlywedge",
    template: "\\curlywedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dagger",
    template: "\\dagger",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dashv",
    template: "\\dashv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ddot",
    template: "\\ddot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ddots",
    template: "\\ddots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Delta",
    template: "\\Delta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\delta",
    template: "\\delta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\diamond",
    template: "\\diamond",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\div",
    template: "\\div",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dot",
    template: "\\dot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\doteq",
    template: "\\doteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dots",
    template: "\\dots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\downarrow",
    template: "\\downarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ell",
    template: "\\ell",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\emptyset",
    template: "\\emptyset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\epsilon",
    template: "\\epsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\equiv",
    template: "\\equiv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\eta",
    template: "\\eta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\exists",
    template: "\\exists",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\forall",
    template: "\\forall",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\frac",
    template: "\\frac",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\frown",
    template: "\\frown",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Gamma",
    template: "\\Gamma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gamma",
    template: "\\gamma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geq",
    template: "\\geq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geqq",
    template: "\\geqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geqslant",
    template: "\\geqslant",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gg",
    template: "\\gg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ggg",
    template: "\\ggg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gtrsim",
    template: "\\gtrsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hat",
    template: "\\hat",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hbar",
    template: "\\hbar",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hline",
    template: "\\hline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hookleftarrow",
    template: "\\hookleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hookrightarrow",
    template: "\\hookrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Im",
    template: "\\Im",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\imath",
    template: "\\imath",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\in",
    template: "\\in",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\infty",
    template: "\\infty",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\int",
    template: "\\int",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\iota",
    template: "\\iota",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\jmath",
    template: "\\jmath",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\kappa",
    template: "\\kappa",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Lambda",
    template: "\\Lambda",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lambda",
    template: "\\lambda",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\langle",
    template: "\\langle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lceil",
    template: "\\lceil",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ldots",
    template: "\\ldots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leadsto",
    template: "\\leadsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Leftarrow",
    template: "\\Leftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftarrow",
    template: "\\leftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftleftarrows",
    template: "\\leftleftarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Leftrightarrow",
    template: "\\Leftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightarrow",
    template: "\\leftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightarrows",
    template: "\\leftrightarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightharpoons",
    template: "\\leftrightharpoons",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leq",
    template: "\\leq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leqq",
    template: "\\leqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leqslant",
    template: "\\leqslant",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lessdot",
    template: "\\lessdot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lesseqgtr",
    template: "\\lesseqgtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lessgtr",
    template: "\\lessgtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lesssim",
    template: "\\lesssim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lfloor",
    template: "\\lfloor",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ll",
    template: "\\ll",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\llbracket",
    template: "\\llbracket",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\llcorner",
    template: "\\llcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lll",
    template: "\\lll",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longdiv",
    template: "\\longdiv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longleftarrow",
    template: "\\longleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longleftarrow",
    template: "\\Longleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longleftrightarrow",
    template: "\\longleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longleftrightarrow",
    template: "\\Longleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longmapsto",
    template: "\\longmapsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longrightarrow",
    template: "\\longrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longrightarrow",
    template: "\\Longrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lrcorner",
    template: "\\lrcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ltimes",
    template: "\\ltimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mapsto",
    template: "\\mapsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathbb",
    template: "\\mathbb",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathbf",
    template: "\\mathbf",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathcal",
    template: "\\mathcal",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathfrak",
    template: "\\mathfrak",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathrm",
    template: "\\mathrm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathscr",
    template: "\\mathscr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mho",
    template: "\\mho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\models",
    template: "\\models",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mp",
    template: "\\mp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mu",
    template: "\\mu",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multicolumn",
    template: "\\multicolumn",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multimap",
    template: "\\multimap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multirow",
    template: "\\multirow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nabla",
    template: "\\nabla",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\natural",
    template: "\\natural",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nearrow",
    template: "\\nearrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\neg",
    template: "\\neg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\neq",
    template: "\\neq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\newline",
    template: "\\newline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nexists",
    template: "\\nexists",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ngtr",
    template: "\\ngtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ni",
    template: "\\ni",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nleftarrow",
    template: "\\nleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nLeftarrow",
    template: "\\nLeftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nless",
    template: "\\nless",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nmid",
    template: "\\nmid",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\not",
    template: "\\not",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\notin",
    template: "\\notin",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nprec",
    template: "\\nprec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\npreceq",
    template: "\\npreceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nrightarrow",
    template: "\\nrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nRightarrow",
    template: "\\nRightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsim",
    template: "\\nsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsubseteq",
    template: "\\nsubseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsucc",
    template: "\\nsucc",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsucceq",
    template: "\\nsucceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsupseteq",
    template: "\\nsupseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nu",
    template: "\\nu",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nVdash",
    template: "\\nVdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nvdash",
    template: "\\nvdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nwarrow",
    template: "\\nwarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\odot",
    template: "\\odot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oiiint",
    template: "\\oiiint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oiint",
    template: "\\oiint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oint",
    template: "\\oint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\omega",
    template: "\\omega",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Omega",
    template: "\\Omega",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ominus",
    template: "\\ominus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\operatorname",
    template: "\\operatorname",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oplus",
    template: "\\oplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oslash",
    template: "\\oslash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\otimes",
    template: "\\otimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overbrace",
    template: "\\overbrace",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overleftarrow",
    template: "\\overleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overleftrightarrow",
    template: "\\overleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overline",
    template: "\\overline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overparen",
    template: "\\overparen",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\parallel",
    template: "\\parallel",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\partial",
    template: "\\partial",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\perp",
    template: "\\perp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Perp",
    template: "\\Perp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\phi",
    template: "\\phi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Phi",
    template: "\\Phi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pi",
    template: "\\pi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Pi",
    template: "\\Pi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pitchfork",
    template: "\\pitchfork",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pm",
    template: "\\pm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prec",
    template: "\\prec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\preccurlyeq",
    template: "\\preccurlyeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\preceq",
    template: "\\preceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\precsim",
    template: "\\precsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prime",
    template: "\\prime",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prod",
    template: "\\prod",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\propto",
    template: "\\propto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\psi",
    template: "\\psi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Psi",
    template: "\\Psi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\qquad",
    template: "\\qquad",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\quad",
    template: "\\quad",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rangle",
    template: "\\rangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rceil",
    template: "\\rceil",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Re",
    template: "\\Re",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rfloor",
    template: "\\rfloor",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rho",
    template: "\\rho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightarrow",
    template: "\\rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Rightarrow",
    template: "\\Rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Rightarrow",
    template: "\\Rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightleftarrows",
    template: "\\rightleftarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightleftharpoons",
    template: "\\rightleftharpoons",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightrightarrows",
    template: "\\rightrightarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightsquigarrow",
    template: "\\rightsquigarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\risingdotseq",
    template: "\\risingdotseq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rrbracket",
    template: "\\rrbracket",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rtimes",
    template: "\\rtimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\S",
    template: "\\S",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\searrow",
    template: "\\searrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sharp",
    template: "\\sharp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sigma",
    template: "\\sigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Sigma",
    template: "\\Sigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sim",
    template: "\\sim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\simeq",
    template: "\\simeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\smile",
    template: "\\smile",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqcap",
    template: "\\sqcap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqcup",
    template: "\\sqcup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqrt",
    template: "\\sqrt",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsubset",
    template: "\\sqsubset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsubseteq",
    template: "\\sqsubseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsupset",
    template: "\\sqsupset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsupseteq",
    template: "\\sqsupseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\square",
    template: "\\square",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\stackrel",
    template: "\\stackrel",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\star",
    template: "\\star",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subset",
    template: "\\subset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subseteq",
    template: "\\subseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subsetneq",
    template: "\\subsetneq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succ",
    template: "\\succ",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succcurlyeq",
    template: "\\succcurlyeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succeq",
    template: "\\succeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succsim",
    template: "\\succsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sum",
    template: "\\sum",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supset",
    template: "\\supset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supseteq",
    template: "\\supseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supseteqq",
    template: "\\supseteqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supsetneq",
    template: "\\supsetneq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supsetneqq",
    template: "\\supsetneqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\swarrow",
    template: "\\swarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\tau",
    template: "\\tau",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\textrm",
    template: "\\textrm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\therefore",
    template: "\\therefore",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\theta",
    template: "\\theta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Theta",
    template: "\\Theta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\tilde",
    template: "\\tilde",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\times",
    template: "\\times",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\top",
    template: "\\top",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangle",
    template: "\\triangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleleft",
    template: "\\triangleleft",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleq",
    template: "\\triangleq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleright",
    template: "\\triangleright",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ulcorner",
    template: "\\ulcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underbrace",
    template: "\\underbrace",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underline",
    template: "\\underline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underset",
    template: "\\underset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\unlhd",
    template: "\\unlhd",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\unrhd",
    template: "\\unrhd",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\uparrow",
    template: "\\uparrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\uplus",
    template: "\\uplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Upsilon",
    template: "\\Upsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\urcorner",
    template: "\\urcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varangle",
    template: "\\varangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Varangle",
    template: "\\Varangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varepsilon",
    template: "\\varepsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varkappa",
    template: "\\varkappa",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varliminf",
    template: "\\varliminf",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varlimsup",
    template: "\\varlimsup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varnothing",
    template: "\\varnothing",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varphi",
    template: "\\varphi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varpi",
    template: "\\varpi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varrho",
    template: "\\varrho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varsigma",
    template: "\\varsigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varsubsetneqq",
    template: "\\varsubsetneqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vartheta",
    template: "\\vartheta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vDash",
    template: "\\vDash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vdash",
    template: "\\vdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vdots",
    template: "\\vdots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vec",
    template: "\\vec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vee",
    template: "\\vee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\wedge",
    template: "\\wedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\widehat",
    template: "\\widehat",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\widetilde",
    template: "\\widetilde",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\wp",
    template: "\\wp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\xi",
    template: "\\xi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Xi",
    template: "\\Xi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\xrightarrow",
    template: "\\xrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\zeta",
    template: "\\zeta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\left[...\\right]",
    template: "\\left[${}\\right]",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\left(...\\right)",
    template: "\\left(${}\\right)",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  }
];
