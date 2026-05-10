import { useCallback, useMemo, useRef, useState } from "react";
import grapesjs from "grapesjs";
import type { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

import {
  DEFAULT_VARIABLES,
  type TemplateBuilderState,
  type TemplateSavePayload,
  type TemplateVariable,
} from "./templateBuilder.types";
import {
  NOTIFICATION_BLOCKS,
  buildEditorConfig,
  buildExportHTML,
  buildVariableBlock,
  extractVariables,
} from "./templateBuilder.config";

const EDITOR_CONTAINER_ID = "tb-grapesjs-container";
const BLOCKS_CONTAINER_ID = "tb-blocks-panel";
const STYLE_MANAGER_CONTAINER_ID = "tb-style-manager";
const DEFAULT_VARIABLE_KEYS = new Set(
  DEFAULT_VARIABLES.map((variable) => variable.key),
);

interface UseTemplateBuilderOptions {
  initialPayload?: TemplateSavePayload | null;
  onSave?: (payload: TemplateSavePayload) => Promise<void> | void;
}

function normalizeVariableKey(key: string) {
  return key
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^([^a-zA-Z])/, "v_$1");
}

function variableForKey(key: string): TemplateVariable {
  return (
    DEFAULT_VARIABLES.find((variable) => variable.key === key) ?? {
      key,
      label: key,
      example: "",
    }
  );
}

function mergeVariables(...groups: TemplateVariable[][]) {
  const merged = new Map<string, TemplateVariable>();

  groups.flat().forEach((variable) => {
    const key = normalizeVariableKey(variable.key);
    if (!key) return;

    merged.set(key, {
      ...merged.get(key),
      ...variable,
      key,
      label: variable.label?.trim() || key,
      example: variable.example ?? "",
    });
  });

  return Array.from(merged.values());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildInitialVariables(payload?: TemplateSavePayload | null) {
  const detectedVariables = (payload?.variables ?? [])
    .map((key) => normalizeVariableKey(key))
    .filter(Boolean)
    .map(variableForKey);

  return mergeVariables(DEFAULT_VARIABLES, detectedVariables);
}

function writeClipboardFallback(value: string) {
  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "true");
  fallback.style.position = "fixed";
  fallback.style.left = "-9999px";
  fallback.style.opacity = "0";
  document.body.appendChild(fallback);
  fallback.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(fallback);
  }
}

function parseImportedHtml(html: string) {
  const trimmedHtml = html.trim();
  if (!/<html[\s>]|<!doctype/i.test(trimmedHtml)) {
    return { components: trimmedHtml, styles: "" };
  }

  const document = new DOMParser().parseFromString(trimmedHtml, "text/html");
  const styles = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n")
    .trim();

  document.querySelectorAll("style, script").forEach((node) => node.remove());

  return {
    components: document.body.innerHTML.trim(),
    styles,
  };
}

export function useTemplateBuilder({
  initialPayload,
  onSave,
}: UseTemplateBuilderOptions = {}) {
  const editorRef = useRef<Editor | null>(null);
  const initialVariables = useMemo(
    () => buildInitialVariables(initialPayload),
    [initialPayload],
  );

  const [state, setState] = useState<TemplateBuilderState>(() => ({
    templateKey: initialPayload?.templateKey ?? "",
    templateName: initialPayload?.name ?? "",
    version: initialPayload?.version ?? 1,
    isSaving: false,
    isPreviewOpen: false,
    isSaveModalOpen: false,
    isImportModalOpen: false,
    customVariables: initialVariables.filter(
      (variable) => !DEFAULT_VARIABLE_KEYS.has(variable.key),
    ),
    importJson: "",
    importHtml: "",
    importError: "",
    saveError: "",
  }));
  const [previewHtml, setPreviewHtml] = useState("");
  const [allVariables, setAllVariables] =
    useState<TemplateVariable[]>(initialVariables);

  const patch = useCallback((partial: Partial<TemplateBuilderState>) => {
    setState((previous) => ({ ...previous, ...partial }));
  }, []);

  const addVariableBlock = useCallback((variable: TemplateVariable) => {
    const editor = editorRef.current;
    if (!editor) return;

    const block = buildVariableBlock(variable);
    const blockManager = editor.BlockManager;
    if (!blockManager.get(block.id)) {
      blockManager.add(
        block.id,
        block as Parameters<typeof blockManager.add>[1],
      );
    }
  }, []);

  const syncVariables = useCallback(
    (variableKeys: string[]) => {
      const detectedVariables = variableKeys
        .map((key) => normalizeVariableKey(key))
        .filter(Boolean)
        .map(variableForKey);

      setAllVariables((previous) => {
        const merged = mergeVariables(
          DEFAULT_VARIABLES,
          previous,
          detectedVariables,
        );
        const customVariables = merged.filter(
          (variable) => !DEFAULT_VARIABLE_KEYS.has(variable.key),
        );

        customVariables.forEach(addVariableBlock);
        setState((current) => ({ ...current, customVariables }));
        return merged;
      });
    },
    [addVariableBlock],
  );

  const mountEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    const editor = grapesjs.init(
      buildEditorConfig(
        EDITOR_CONTAINER_ID,
        BLOCKS_CONTAINER_ID,
        STYLE_MANAGER_CONTAINER_ID,
      ),
    );
    editorRef.current = editor;

    const blockManager = editor.BlockManager;
    NOTIFICATION_BLOCKS.forEach((block) => {
      if (!blockManager.get(block.id)) {
        blockManager.add(
          block.id,
          block as Parameters<typeof blockManager.add>[1],
        );
      }
    });
    initialVariables.forEach(addVariableBlock);

    if (initialPayload?.project) {
      try {
        editor.loadProjectData(
          initialPayload.project as Parameters<
            typeof editor.loadProjectData
          >[0],
        );
      } catch (error) {
        console.error("[TemplateBuilder] Could not load project data", error);
      }
    }

    syncVariables(
      initialPayload?.variables ?? extractVariables(editor.getHtml()),
    );
    editor.Keymaps.add("template-builder:save", "ctrl+s, command+s", () => {
      patch({ isSaveModalOpen: true, saveError: "" });
      return false;
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [
    addVariableBlock,
    initialPayload,
    initialVariables,
    patch,
    syncVariables,
  ]);

  const addCustomVariable = useCallback(
    (key: string, label: string, example = "") => {
      const normalizedKey = normalizeVariableKey(key);
      if (!normalizedKey) return false;

      const newVariable: TemplateVariable = {
        key: normalizedKey,
        label: label.trim() || normalizedKey,
        example: example.trim(),
      };

      setAllVariables((previous) => {
        const merged = mergeVariables(previous, [newVariable]);
        return merged;
      });
      setState((previous) => ({
        ...previous,
        customVariables: mergeVariables(previous.customVariables, [
          newVariable,
        ]),
      }));
      addVariableBlock(newVariable);
      return true;
    },
    [addVariableBlock],
  );

  const insertVariableAtCursor = useCallback((variable: TemplateVariable) => {
    const editor = editorRef.current;
    if (!editor) return;

    const block = buildVariableBlock(variable);
    const selected = editor.getSelected();
    if (selected) {
      selected.append(block.content as string);
      return;
    }

    editor.addComponents(block.content as string);
  }, []);

  const setDevice = useCallback((device: "Desktop" | "Tablet" | "Mobile") => {
    editorRef.current?.setDevice(device);
  }, []);

  const buildPreviewHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return "";

    let html = buildExportHTML(editor.getHtml(), editor.getCss() ?? "");
    allVariables.forEach((variable) => {
      const token = new RegExp(
        `\\{\\{\\s*${escapeRegExp(variable.key)}\\s*\\}\\}`,
        "g",
      );
      html = html.replace(token, variable.example || `[${variable.key}]`);
    });

    return html;
  }, [allVariables]);

  const openPreview = useCallback(() => {
    const html = buildPreviewHtml();
    if (!html) return;

    setPreviewHtml(html);
    patch({ isPreviewOpen: true });
  }, [buildPreviewHtml, patch]);

  const closePreview = useCallback(() => {
    setPreviewHtml("");
    patch({ isPreviewOpen: false });
  }, [patch]);

  const copyHtmlToClipboard = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return false;

    const html = buildExportHTML(editor.getHtml(), editor.getCss() ?? "");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html);
        return true;
      }

      return writeClipboardFallback(html);
    } catch {
      return writeClipboardFallback(html);
    }
  }, []);

  const importFromJson = useCallback(
    (jsonString: string) => {
      const editor = editorRef.current;
      if (!editor) return false;

      try {
        const project = JSON.parse(jsonString);
        editor.loadProjectData(project);
        syncVariables(extractVariables(editor.getHtml()));
        patch({ isImportModalOpen: false, importJson: "", importError: "" });
        return true;
      } catch {
        patch({
          importError: "Invalid project JSON. Please check the exported file.",
        });
        return false;
      }
    },
    [patch, syncVariables],
  );

  const importFromHtml = useCallback(
    (html: string) => {
      const editor = editorRef.current;
      if (!editor) return false;

      try {
        const imported = parseImportedHtml(html);
        editor.setComponents(imported.components);
        if (imported.styles) {
          editor.setStyle(imported.styles);
        }
        syncVariables(extractVariables(editor.getHtml()));
        patch({ isImportModalOpen: false, importHtml: "", importError: "" });
        return true;
      } catch {
        patch({ importError: "Could not parse this HTML." });
        return false;
      }
    },
    [patch, syncVariables],
  );

  const undo = useCallback(() => editorRef.current?.UndoManager.undo(), []);
  const redo = useCallback(() => editorRef.current?.UndoManager.redo(), []);

  const save = useCallback(
    async (templateKey: string, templateName: string) => {
      const editor = editorRef.current;
      if (!editor) return false;

      const normalizedKey = normalizeVariableKey(templateKey).toLowerCase();
      const name = templateName.trim();

      if (!normalizedKey || !name) {
        patch({ saveError: "Template name and key are required." });
        return false;
      }

      patch({ isSaving: true, saveError: "" });

      try {
        const rawHtml = editor.getHtml();

        const payload: TemplateSavePayload = {
          templateKey: normalizedKey,
          name,
          version: state.version + 1,
          html: buildExportHTML(rawHtml, editor.getCss() ?? ""),
          project: editor.getProjectData(),
          variables: extractVariables(rawHtml),
        };

        console.log("[TemplateBuilder] Saving payload:", payload);

        await onSave?.(payload);

        patch({
          isSaving: false,
          isSaveModalOpen: false,
          templateKey: payload.templateKey,
          templateName: payload.name,
          version: state.version + 1,
        });

        return true;
      } catch (error) {
        patch({
          isSaving: false,
          saveError:
            error instanceof Error ? error.message : "Template save failed.",
        });

        return false;
      }
    },
    [onSave, patch, state.version],
  );

  return {
    editorContainerId: EDITOR_CONTAINER_ID,
    blocksContainerId: BLOCKS_CONTAINER_ID,
    styleManagerContainerId: STYLE_MANAGER_CONTAINER_ID,
    state,
    patch,
    allVariables,
    previewHtml,
    mountEditor,
    save,
    undo,
    redo,
    setDevice,
    openPreview,
    closePreview,
    copyHtmlToClipboard,
    importFromJson,
    importFromHtml,
    addCustomVariable,
    insertVariableAtCursor,
  };
}
