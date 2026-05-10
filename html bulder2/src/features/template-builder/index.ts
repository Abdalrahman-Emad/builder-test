// ─────────────────────────────────────────────────────────────────────────────
// Template Builder — Public API
// Import from this file only. Internal modules are considered private.
// ─────────────────────────────────────────────────────────────────────────────

export { TemplateBuilderPage } from "./TemplateBuilderPage";
export { default as TemplateBuilderPageDefault } from "./TemplateBuilderPage";
export { useTemplateBuilder } from "./useTemplateBuilder";
export {
  extractVariables,
  buildExportHTML,
  buildVariableBlock,
} from "./templateBuilder.config";
export { DEFAULT_VARIABLES as TEMPLATE_BUILDER_DEFAULT_VARIABLES } from "./templateBuilder.types";
export type {
  TemplateSavePayload,
  TemplateRecord,
  TemplateVariable,
  GrapesProjectJSON,
  TemplateBuilderState,
} from "./templateBuilder.types";