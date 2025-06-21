import { MarkdownConfig } from "@lezer/markdown";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { foldInside, StreamLanguage, foldNodeProp } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight"; 

const frontMatterFence = /^-------\s*$/m;

const yamlNodes = [
  // prefixed original YAML nodes
  "YAMLatom",
  { name: "YAMLmeta", block: true },
  "YAMLnumber",
  "YAMLkeyword",
  "YAMLdef",
  "YAMLcomment",
  "YAMLstring",
];

/**
 * Lezer Markdown extension for YAML frontmatter support. This includes support
 * for parsing, syntax highlighting and folding.
 */
export const blockYamlConfig: MarkdownConfig = {
  props: [
    styleTags({
      YAMLnumber: tags.number,
      YAMLkeyword: tags.keyword,
      YAMLdef: tags.definition(tags.labelName),
      YAMLcomment: tags.comment,
      YAMLstring: tags.string,
      YAMLatom: tags.atom,
      YAMLmeta: tags.meta,
      FrontmatterMark: tags.processingInstruction,
    }),
    foldNodeProp.add({
      // node.from has 3 added to it to prevent the hyphen fence
      // from getting folded
      // Frontmatter: (node) => ({ from: node.from + 3, to: node.to }),
      Frontmatter: foldInside,
      // Marks don't need to be folded
      FrontmatterMark: () => null,
    }),
  ],
  defineNodes: [
    { name: "Frontmatter", block: true },
    "FrontmatterMark",
    ...yamlNodes,
  ],
  parseBlock: [
    {
      name: "Frontmatter",
      before: "HorizontalRule",
      parse: (cx, line) => {
        let matter = "";
        const yamlParser = StreamLanguage.define(yaml).parser;
        const startPos = cx.lineStart;
        let endPos: number;
        // Do not parse if frontmatter is not at the top
        if (startPos !== 0) return false;
        // Only continue when we find the start of the frontmatter
        if (!frontMatterFence.test(line.text)) return false;
        while (cx.nextLine()) {
          if (frontMatterFence.test(line.text)) {
            const parsedYaml = yamlParser.parse(matter);
            const children = [];
            children.push(cx.elt("FrontmatterMark", startPos, startPos + 8));
            const { length } = matter;
            parsedYaml.iterate({
              enter: ({ type, from, to }) => {
                // We don't want the top node, we need the
                // inner nodes
                if (type.name === "Document") return;
                if (startPos + to > length) return;
                children.push(
                  cx.elt(
                    // The element name is prefixed with
                    // 'YAML' to prevent future collisions
                    "YAML" + type.name,
                    startPos + 8 + from,
                    startPos + 8 + to,
                  ),
                );
              },
            });
            endPos = cx.lineStart + line.text.length;
            children.push(cx.elt("FrontmatterMark", cx.lineStart, endPos));
            cx.addElement(cx.elt("Frontmatter", startPos, endPos, children));
            return false;
          } else {
            matter += line.text + "\n";
          }
        }
        return true;
      },
    },
  ],
};
