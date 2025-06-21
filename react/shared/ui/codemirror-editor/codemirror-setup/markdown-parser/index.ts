import { MarkdownConfig } from "@lezer/markdown";
import { blockYamlConfig } from "./block-yaml-config";
import { BlockMathConfig } from "./block-math-config";
import { BlockMultiMathConfig } from "./block-multiMath-config";
import { InlineMathConfig } from "./inline-math-config";
import { InlineMultiMathConfig } from "./inline-multiMath-config";
import { inlineLatexConfig } from "./inline-latex-config";
import { InlineImageConfig } from "./inline-image-config";
import { inlineLatexFootnotesConfig } from "./inline-latex-footnotes";
import { markdownHighlight } from "./markdown";

/** Markdown configuration for block and inline math support. */
const MarkdownMathExtension: MarkdownConfig[] = [
  blockYamlConfig,
  BlockMathConfig,
  BlockMultiMathConfig,
  InlineMultiMathConfig,
  InlineMathConfig,
  inlineLatexConfig,
  InlineImageConfig,
  inlineLatexFootnotesConfig,
  markdownHighlight
];

export { MarkdownMathExtension };
