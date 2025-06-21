//file: react/shared/ui/codemirror-editor/codemirror-setup/theme/index.ts

import { EditorView } from "@codemirror/view";

export const PADDING_TOP_CM_CONTENT = 18;

/** TODO: Add styling */
export const defaultLightThemeOption = EditorView.theme(
  {
    "&": {
      backgroundColor: "#FFFFFF",
    },
    ".ͼi": {
      color: "#4960FF",
    },
    ".ͼb": {
      color: "#DD3C71",
    },
    ".ͼc": {
      color: "#4960FF",
    },
    ".ͼk": {
      color: "#0093FF",
    },
    ".ͼd": {
      color: "#0093FF",
    },
    ".ͼe": {
      color: "#dd3c71",
    },
    ".ͼn": {
      color: "#4960FF",
    },
    ".ͼ5": {
      color: "#0093FF",
    },
    ".ͼ6": {
      color: "#0093FF",
    },
  },
  {
    dark: false,
  },
);

export const defaultDarkThemeOption = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1E1E20",
    },
    ".ͼi": {
      color: "#8080FF",
    },
    ".ͼb": {
      color: "#F6558B",
    },
    ".ͼc": {
      color: "#8080FF",
    },
    ".ͼk": {
      color: "#47BCFF",
    },
    ".ͼd": {
      color: "#47BCFF",
    },
    ".ͼe": {
      color: "#F6558B",
    },
    ".ͼn": {
      color: "#8080FF",
    },
    ".ͼ5": {
      color: "#0093FF",
    },
    ".ͼ6": {
      color: "#8080FF",
    },
    ".cm-cursor": {
      borderLeftColor: "#47BCFF",
    },
  },
  {
    dark: true,
  },
);

export const defaultFocusThemeOption = EditorView.theme({
  "&.cm-editor": {
    "&.cm-focused": {
      outline: "none",
    },
  },
});

export const defaultGuttersThemeOption = EditorView.theme({
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
  },
  ".cm-gutter": {
    "&.cm-lineNumbers": {
      color: "#999",
      minWidth: "20px",
      textAlign: "right",
      whiteSpace: "nowrap",
      borderRight: "1px solid #ddd",
    },
    "&.cm-foldGutter": {},
  },
});

export const defaultActiveLineOption = EditorView.theme({
  ".cm-activeLineGutter": {
    backgroundColor: "var(--activeLineGutterBackground)",
  },
});

export const defaultFoldThemeOptions = EditorView.theme({
  ".cm-foldPlaceholder": {
    color: "var(--buttonPrimaryActive)",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "none",
    margin: "0",
    padding: "0",
    cursor: "pointer",
    "&:hover": {
      color: "var(--content-blue)",
    },
  },
});

export const defaultSelectionThemeOptions = EditorView.theme({
  ".cm-selectionBackground": {
    background: "var(--textHighlightColor)",
    color: "unset",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    background: "var(--textHighlightColor)",
    color: "unset",
  },
});

export const defaultInlineCodeThemeOptions = EditorView.theme({
  ".cm-inlineCode": {
    color: "var(--content-02)",
  },
});

export const defaultWidgetThemeOptions = EditorView.theme({
  ".widget-content": {
    fontFamily: "IBM Plex Sans",
    fontSize: "18px",
    visibility: "visible",
    position: "relative",
  },
  ".widget-content > img": {
    minWidth: "100%",
  },
});

/** Adds styles to the base theme */
export const defaultThemeOption = (
  cmContentPaddingTop: number = PADDING_TOP_CM_CONTENT,
  fontSize: string = "14px",
) => {
  return [
    defaultFocusThemeOption,
    defaultGuttersThemeOption,
    defaultActiveLineOption,
    defaultFoldThemeOptions,
    defaultSelectionThemeOptions,
    defaultInlineCodeThemeOptions,
    defaultWidgetThemeOptions,
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: `${fontSize}`,
        fontFamily: '"Roboto Mono", Helvetica, Arial, sans-serif',
      },
      ".cm-content": {
        paddingTop: `${cmContentPaddingTop}px`,
        paddingBottom: "calc(100vh - 91px)",
      },
      ".cm-scroller": {
        fontFamily: '"Roboto Mono", Helvetica, Arial, sans-serif',
        lineHeight: "23px",
        overflowY: "auto",
      },
      ".cm-line": {
        padding: "0 7px",
      },
    }),
  ] as const;
};
