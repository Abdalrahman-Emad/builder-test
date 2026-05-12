import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
  type KeyboardEvent,
} from "react";
import type { TemplateSavePayload } from "./templateBuilder.types";
import { useTemplateBuilder } from "./useTemplateBuilder";

interface TemplateBuilderPageProps {
  initialTemplate?: TemplateSavePayload | null;
  onSave?: (payload: TemplateSavePayload) => Promise<void> | void;
  onBack?: () => void;
}

type ButtonVariant = "default" | "primary" | "danger" | "ghost";

const colors = {
  bg: "#10121f",
  panel: "#171a2b",
  panelElevated: "#1e2235",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(129, 140, 248, 0.45)",
  text: "#f8fafc",
  muted: "#94a3b8",
  subtle: "#64748b",
  primary: "#4f46e5",
  primarySoft: "rgba(79, 70, 229, 0.16)",
  danger: "#ef4444",
};

const iconPaths = {
  back: "M19 12H5M12 5l-7 7 7 7",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-1",
  redo: "m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h1",
  desktop: "M3 5h18v12H3zM8 21h8M12 17v4",
  tablet: "M6 3h12v18H6zM11 17h2",
  mobile: "M8 2h8v20H8zM11 18h2",
  import: "M12 3v12M7 10l5 5 5-5M5 21h14",
  preview: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  copy: "M8 8h11v11H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v7h8M7 21v-8h10v8",
  plus: "M12 5v14M5 12h14",
  close: "M18 6 6 18M6 6l12 12",
  warning: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
};

const Icon: FC<{ path: string; size?: number }> = ({ path, size = 15 }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
  >
    <path d={path} />
  </svg>
);

const buttonStyle = (
  variant: ButtonVariant,
  disabled?: boolean
): CSSProperties => {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.52 : 1,
    transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease",
  };

  const variants: Record<ButtonVariant, CSSProperties> = {
    default: { background: "rgba(255,255,255,0.07)" },
    primary: {
      background: colors.primary,
      borderColor: "rgba(129, 140, 248, 0.65)",
      boxShadow: "0 10px 24px rgba(79, 70, 229, 0.22)",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.14)",
      borderColor: "rgba(248, 113, 113, 0.38)",
      color: "#fecaca",
    },
    ghost: {
      background: "transparent",
      borderColor: "transparent",
      color: colors.muted,
    },
  };

  return { ...base, ...variants[variant] };
};

const ToolbarButton: FC<{
  onClick: () => void;
  title: string;
  icon: string;
  children?: React.ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
}> = ({ onClick, title, icon, children, disabled, variant = "default" }) => (
  <button
    type="button"
    aria-label={title}
    title={title}
    disabled={disabled}
    onClick={onClick}
    style={buttonStyle(variant, disabled)}
  >
    <Icon path={icon} />
    {children}
  </button>
);

const Modal: FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}> = ({ open, onClose, title, children, width = 480 }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        background: "rgba(2, 6, 23, 0.74)",
        backdropFilter: "blur(8px)",
      }}
    >
      <section
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "92vh",
          overflow: "auto",
          background: colors.panelElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, color: colors.text }}>{title}</h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            style={{
              ...buttonStyle("ghost"),
              width: 32,
              minHeight: 32,
              padding: 0,
            }}
          >
            <Icon path={iconPaths.close} />
          </button>
        </header>
        <div style={{ padding: 18 }}>{children}</div>
      </section>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  padding: "8px 10px",
  background: "rgba(15, 23, 42, 0.52)",
  border: `1px solid ${colors.border}`,
  borderRadius: 7,
  color: colors.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 700,
};

const sidebarStyle: CSSProperties = {
  width: 240,
  minWidth: 240,
  display: "flex",
  flexDirection: "column",
  background: "#0f172a", 
  borderRight: "1px solid rgba(148, 163, 184, 0.12)",
  position: "relative",
  zIndex: 10,
};

const sidebarTabButtonStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  minHeight: 42,
  border: 0,
  borderBottom: active ? `2px solid ${colors.primary}` : "2px solid transparent",
  background: "transparent",
  color: active ? colors.text : colors.muted,
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "color 140ms ease, border-color 140ms ease",
});

const sidebarSectionStyle: CSSProperties = {
  padding: "14px 14px 12px",
  borderTop: `1px solid rgba(148, 163, 184, 0.12)`,
};

const sidebarSectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 10,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 700,
};


const sidebarCardButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  minHeight: 38,
  padding: "9px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid transparent",
  borderRadius: 10,
  color: colors.text,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  transition: "background 140ms ease, border-color 140ms ease",
};

function normalizeTemplateKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
}

export const TemplateBuilderPage: FC<TemplateBuilderPageProps> = ({
  initialTemplate,
  onSave,
  onBack,
}) => {
  const {
    editorContainerId,
    blocksContainerId,
    styleManagerContainerId,
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
  } = useTemplateBuilder({ initialPayload: initialTemplate, onSave });

  const [activeTab, setActiveTab] = useState<"blocks" | "styles">("blocks");
  const [activeDevice, setActiveDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [importTab, setImportTab] = useState<"json" | "html">("json");
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarExample, setNewVarExample] = useState("");
  const [varPanelOpen, setVarPanelOpen] = useState(true);

  useEffect(() => {
    return mountEditor();
  }, [mountEditor]);

  const switchDevice = useCallback(
    (device: "Desktop" | "Tablet" | "Mobile") => {
      setDevice(device);
      setActiveDevice(device);
    },
    [setDevice]
  );

  const handleCopyHtml = useCallback(async () => {
    const copied = await copyHtmlToClipboard();
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }, [copyHtmlToClipboard]);

  const handleAddVariable = useCallback(() => {
    const added = addCustomVariable(newVarKey, newVarLabel, newVarExample);
    if (!added) return;

    setNewVarKey("");
    setNewVarLabel("");
    setNewVarExample("");
  }, [addCustomVariable, newVarExample, newVarKey, newVarLabel]);

  const handleVariableKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") handleAddVariable();
    },
    [handleAddVariable]
  );

  const saveDisabled =
    !state.templateKey.trim() || !state.templateName.trim() || state.isSaving;
  const variableButtonDisabled = !newVarKey.trim();
  const deviceButtons = useMemo(
    () => [
      { key: "Desktop" as const, icon: iconPaths.desktop },
      { key: "Tablet" as const, icon: iconPaths.tablet },
      { key: "Mobile" as const, icon: iconPaths.mobile },
    ],
    []
  );

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    minHeight: 34,
    background: active ? colors.primarySoft : "transparent",
    border: `1px solid ${active ? colors.borderStrong : "transparent"}`,
    borderRadius: 7,
    color: active ? "#c7d2fe" : colors.muted,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
  });

  return (
    <>
      <style>{`
        #tb-root * { box-sizing: border-box; }
        #tb-root button:focus-visible,
        #tb-root input:focus-visible,
        #tb-root textarea:focus-visible {
          outline: 2px solid rgba(129, 140, 248, 0.72);
          outline-offset: 2px;
        }
        #tb-root .gjs-cv-canvas { background: #eef2f7 !important; }
        #tb-root .gjs-frame-wrapper { margin: 0 auto; box-shadow: 0 18px 55px rgba(15, 23, 42, 0.18); }
        #tb-root .gjs-toolbar { background: #111827 !important; border-radius: 7px !important; }
        #tb-root .gjs-toolbar-item { color: #c7d2fe !important; }
        #tb-root .gjs-selected { outline: 2px solid #4f46e5 !important; outline-offset: 1px; }
        #tb-root .gjs-hovered { outline: 1px dashed #818cf8 !important; }
        #${blocksContainerId} .gjs-blocks-c { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; }
        #${blocksContainerId} .gjs-block {
          width: auto !important;
          min-height: 68px !important;
          margin: 0 !important;
          padding: 10px 8px !important;
          border: 1px solid rgba(148, 163, 184, 0.14) !important;
          border-radius: 8px !important;
          background: rgba(255,255,255,0.045) !important;
          color: #cbd5e1 !important;
          box-shadow: none !important;
          transition: background 140ms ease, border-color 140ms ease, color 140ms ease !important;
        }
        #${blocksContainerId} .gjs-block:hover {
          background: rgba(79, 70, 229, 0.14) !important;
          border-color: rgba(129, 140, 248, 0.42) !important;
          color: #c7d2fe !important;
        }
        #${blocksContainerId} .gjs-block__media { color: inherit !important; margin-bottom: 4px !important; }
        #${blocksContainerId} .gjs-block-label { font-size: 11px !important; line-height: 1.2 !important; }
        #${blocksContainerId} .gjs-block-category__title {
          padding: 10px 12px 6px !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          border-top: 1px solid rgba(148, 163, 184, 0.12) !important;
        }
        #${styleManagerContainerId} { height: calc(100% - 44px); overflow: auto; padding: 8px 10px 12px; color: #cbd5e1; }
        #${styleManagerContainerId} .gjs-sm-sector { border-bottom: 1px solid rgba(148, 163, 184, 0.13) !important; }
        #${styleManagerContainerId} .gjs-sm-sector-title { background: transparent !important; color: #cbd5e1 !important; font-weight: 800 !important; }
        #${styleManagerContainerId} .gjs-field { background: rgba(15, 23, 42, 0.55) !important; border: 1px solid rgba(148, 163, 184, 0.16) !important; }
        #tb-sidebar-scroll::-webkit-scrollbar,
        #${styleManagerContainerId}::-webkit-scrollbar { width: 6px; }
        #tb-sidebar-scroll::-webkit-scrollbar-thumb,
        #${styleManagerContainerId}::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 999px; }
      `}</style>

      <div
        id="tb-root"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          minHeight: 640,
          overflow: "hidden",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 58,
            padding: "0 14px",
            background: "#151827",
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {onBack && (
            <ToolbarButton icon={iconPaths.back} title="Back" variant="ghost" onClick={onBack}>
              Back
            </ToolbarButton>
          )}

          <div style={{ minWidth: 0, marginRight: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>
              HTML Template Builder
            </div>
            <div style={{ fontSize: 12, color: colors.muted }}>
              {state.templateName || "Untitled template"}
              {state.version > 1 ? ` - version ${state.version}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, padding: 4, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
            {deviceButtons.map((device) => (
              <button
                key={device.key}
                type="button"
                title={device.key}
                aria-label={device.key}
                onClick={() => switchDevice(device.key)}
                style={{
                  ...buttonStyle(activeDevice === device.key ? "primary" : "ghost"),
                  width: 34,
                  minHeight: 30,
                  padding: 0,
                  boxShadow: "none",
                }}
              >
                <Icon path={device.icon} />
              </button>
            ))}
          </div>

          <ToolbarButton icon={iconPaths.undo} title="Undo" onClick={undo} />
          <ToolbarButton icon={iconPaths.redo} title="Redo" onClick={redo} />
          <ToolbarButton
            icon={iconPaths.import}
            title="Import"
            onClick={() => patch({ isImportModalOpen: true, importError: "" })}
          >
            Import
          </ToolbarButton>
          <ToolbarButton icon={iconPaths.preview} title="Preview" onClick={openPreview}>
            Preview
          </ToolbarButton>
          <ToolbarButton icon={iconPaths.copy} title="Copy HTML" onClick={handleCopyHtml}>
            {copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : "Copy HTML"}
          </ToolbarButton>
          <ToolbarButton
            icon={iconPaths.save}
            title="Save template"
            variant="primary"
            onClick={() => patch({ isSaveModalOpen: true, saveError: "" })}
          >
            Save
          </ToolbarButton>
        </header>

        <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
          <aside style={sidebarStyle}>
            <div style={{ display: "flex", gap: 6, padding: "14px 14px 0" }}>
              <button type="button" onClick={() => setActiveTab("blocks")} style={sidebarTabButtonStyle(activeTab === "blocks")}>
                Blocks
              </button>
              <button type="button" onClick={() => setActiveTab("styles")} style={sidebarTabButtonStyle(activeTab === "styles")}>
                Styles
              </button>
            </div>

            <div
              id="tb-sidebar-scroll"
              style={{
                display: activeTab === "blocks" ? "block" : "none",
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              }}
            >
                <div id={blocksContainerId} />

                <section style={sidebarSectionStyle}>
                  <button
                    type="button"
                    onClick={() => setVarPanelOpen((open) => !open)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 36,
                      background: "transparent",
                      border: 0,
                      color: colors.text,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    <span>Add Custom Variable</span>
                    <Icon path={varPanelOpen ? iconPaths.close : iconPaths.plus} size={14} />
                  </button>

                  {varPanelOpen && (
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      <input
                        style={inputStyle}
                        placeholder="Variable key, e.g. invoiceId"
                        value={newVarKey}
                        onChange={(event) => setNewVarKey(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Label, e.g. Invoice ID"
                        value={newVarLabel}
                        onChange={(event) => setNewVarLabel(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Preview value"
                        value={newVarExample}
                        onChange={(event) => setNewVarExample(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <button
                        type="button"
                        disabled={variableButtonDisabled}
                        onClick={handleAddVariable}
                        style={{
                          ...buttonStyle("primary", variableButtonDisabled),
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        <Icon path={iconPaths.plus} />
                        Add Variable
                      </button>
                    </div>
                  )}
                </section>

                <section style={{ borderTop: `1px solid ${colors.border}`, padding: "12px 10px 16px" }}>
                  <h3 style={{ margin: "0 0 9px", color: colors.muted, fontSize: 12 }}>
                    Quick Insert Variables
                  </h3>
                  <div style={{ display: "grid", gap: 5 }}>
                    {allVariables.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        title={`Insert {{${variable.key}}}`}
                        onClick={() => insertVariableAtCursor(variable)}
                        style={{
                          ...sidebarCardButtonStyle,
                          color: colors.text,
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {variable.label}
                        </span>
                        <code
                          style={{
                            flexShrink: 0,
                            color: "#f59e0b",
                            background: "rgba(245, 158, 11, 0.12)",
                            borderRadius: 5,
                            padding: "2px 5px",
                            fontSize: 11,
                          }}
                        >
                          {`{{${variable.key}}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            <div
              style={{
                display: activeTab === "styles" ? "block" : "none",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
                <div style={{ padding: "12px 12px 0", color: colors.subtle, fontSize: 12 }}>
                  Select an element on the canvas to edit its styles.
                </div>
                <div id={styleManagerContainerId} />
              </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0, overflow: "hidden", background: "#e5e7eb" }}>
            <div id={editorContainerId} style={{ width: "100%", height: "100%" }} />
          </main>
        </div>
      </div>

      <Modal
        open={state.isSaveModalOpen}
        onClose={() => patch({ isSaveModalOpen: false, saveError: "" })}
        title="Save Template"
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Template Name</label>
            <input
              autoFocus
              style={inputStyle}
              placeholder="Enter Template Name "
              value={state.templateName}
              onChange={(event) =>
                patch({ templateName: event.target.value, saveError: "" })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Template Key</label>
            <input
              style={{ ...inputStyle, fontFamily: "Consolas, monospace" }}
              placeholder="template_key"
              value={state.templateKey}
              onChange={(event) =>
                patch({
                  templateKey: normalizeTemplateKey(event.target.value),
                  saveError: "",
                })
              }
            />
          </div>

          {state.saveError && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                color: "#fecaca",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(248, 113, 113, 0.28)",
                borderRadius: 7,
                padding: 10,
                fontSize: 12,
              }}
            >
              <Icon path={iconPaths.warning} />
              <span>{state.saveError}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => patch({ isSaveModalOpen: false, saveError: "" })}
              style={buttonStyle("default")}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveDisabled}
              onClick={() => void save(state.templateKey, state.templateName)}
              style={buttonStyle("primary", saveDisabled)}
            >
              {state.isSaving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={state.isImportModalOpen}
        onClose={() => patch({ isImportModalOpen: false, importError: "" })}
        title="Import Template"
        width={560}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setImportTab("json")} style={tabButtonStyle(importTab === "json")}>
              Project JSON
            </button>
            <button type="button" onClick={() => setImportTab("html")} style={tabButtonStyle(importTab === "html")}>
              HTML
            </button>
          </div>

          <textarea
            style={{
              ...inputStyle,
              minHeight: 220,
              resize: "vertical",
              lineHeight: 1.55,
              fontFamily: "Consolas, monospace",
            }}
            placeholder={importTab === "json" ? '{ "pages": [], "styles": [] }' : "<table>...</table>"}
            value={importTab === "json" ? state.importJson : state.importHtml}
            onChange={(event) =>
              patch(
                importTab === "json"
                  ? { importJson: event.target.value, importError: "" }
                  : { importHtml: event.target.value, importError: "" }
              )
            }
          />

          {state.importError && (
            <div style={{ color: "#fecaca", fontSize: 12 }}>{state.importError}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={
                importTab === "json" ? !state.importJson.trim() : !state.importHtml.trim()
              }
              onClick={() =>
                importTab === "json"
                  ? importFromJson(state.importJson)
                  : importFromHtml(state.importHtml)
              }
              style={buttonStyle(
                "primary",
                importTab === "json" ? !state.importJson.trim() : !state.importHtml.trim()
              )}
            >
              {importTab === "json" ? "Load Project" : "Import HTML"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={state.isPreviewOpen} onClose={closePreview} title="Template Preview" width={760}>
        <div
          style={{
            height: 520,
            overflow: "hidden",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <iframe
            title="Template Preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            style={{ width: "100%", height: "100%", border: 0, background: "#ffffff" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default TemplateBuilderPage;


/******************************/

'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
  type KeyboardEvent,
} from "react";
import type { TemplateSavePayload } from "./components/template-builder/templateBuilder.types";
import { useTemplateBuilder } from "./components/template-builder/useTemplateBuilder";

interface TemplateBuilderPageProps {
  initialTemplate?: TemplateSavePayload | null;
  onSave?: (payload: TemplateSavePayload) => Promise<void> | void;
  onBack?: () => void;
}

type ButtonVariant = "default" | "primary" | "danger" | "ghost";

const colors = {
  bg: "#10121f",
  panel: "#171a2b",
  panelElevated: "#1e2235",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(129, 140, 248, 0.45)",
  text: "#f8fafc",
  muted: "#94a3b8",
  subtle: "#64748b",
  primary: "#4f46e5",
  primarySoft: "rgba(79, 70, 229, 0.16)",
  danger: "#ef4444",
};

const iconPaths = {
  back: "M19 12H5M12 5l-7 7 7 7",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-1",
  redo: "m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h1",
  desktop: "M3 5h18v12H3zM8 21h8M12 17v4",
  tablet: "M6 3h12v18H6zM11 17h2",
  mobile: "M8 2h8v20H8zM11 18h2",
  import: "M12 3v12M7 10l5 5 5-5M5 21h14",
  preview: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  copy: "M8 8h11v11H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v7h8M7 21v-8h10v8",
  plus: "M12 5v14M5 12h14",
  close: "M18 6 6 18M6 6l12 12",
  warning: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
};

const Icon: FC<{ path: string; size?: number }> = ({ path, size = 15 }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
  >
    <path d={path} />
  </svg>
);

const buttonStyle = (
  variant: ButtonVariant,
  disabled?: boolean
): CSSProperties => {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.52 : 1,
    transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease",
  };

  const variants: Record<ButtonVariant, CSSProperties> = {
    default: { background: "rgba(255,255,255,0.07)" },
    primary: {
      background: colors.primary,
      borderColor: "rgba(129, 140, 248, 0.65)",
      boxShadow: "0 10px 24px rgba(79, 70, 229, 0.22)",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.14)",
      borderColor: "rgba(248, 113, 113, 0.38)",
      color: "#fecaca",
    },
    ghost: {
      background: "transparent",
      borderColor: "transparent",
      color: colors.muted,
    },
  };

  return { ...base, ...variants[variant] };
};

const ToolbarButton: FC<{
  onClick: () => void;
  title: string;
  icon: string;
  children?: React.ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
}> = ({ onClick, title, icon, children, disabled, variant = "default" }) => (
  <button
    type="button"
    aria-label={title}
    title={title}
    disabled={disabled}
    onClick={onClick}
    style={buttonStyle(variant, disabled)}
  >
    <Icon path={icon} />
    {children}
  </button>
);

const Modal: FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}> = ({ open, onClose, title, children, width = 480 }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        background: "rgba(2, 6, 23, 0.74)",
        backdropFilter: "blur(8px)",
      }}
    >
      <section
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "92vh",
          overflow: "auto",
          background: colors.panelElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, color: colors.text }}>{title}</h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            style={{
              ...buttonStyle("ghost"),
              width: 32,
              minHeight: 32,
              padding: 0,
            }}
          >
            <Icon path={iconPaths.close} />
          </button>
        </header>
        <div style={{ padding: 18 }}>{children}</div>
      </section>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  padding: "8px 10px",
  background: "rgba(15, 23, 42, 0.52)",
  border: `1px solid ${colors.border}`,
  borderRadius: 7,
  color: colors.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 700,
};

const sidebarStyle: CSSProperties = {
  width: 260,
  minWidth: 240,
  display: "flex",
  flexDirection: "column",
  background: "#0f172a", 
  borderRight: "1px solid rgba(148, 163, 184, 0.12)",
  position: "relative",
  zIndex: 10,
};

const sidebarTabButtonStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  minHeight: 42,
  border: 0,
  borderBottom: active ? `2px solid ${colors.primary}` : "2px solid transparent",
  background: "transparent",
  color: active ? colors.text : colors.muted,
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "color 140ms ease, border-color 140ms ease",
});

const sidebarSectionStyle: CSSProperties = {
  padding: "14px 14px 12px",
  borderTop: `1px solid rgba(148, 163, 184, 0.12)`,
};

const sidebarSectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 10,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 700,
};


const sidebarCardButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  minHeight: 38,
  padding: "9px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid transparent",
  borderRadius: 10,
  color: colors.text,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  transition: "background 140ms ease, border-color 140ms ease",
};

function normalizeTemplateKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
}

export const TemplateBuilderPage: FC<TemplateBuilderPageProps> = ({
  initialTemplate,
  onSave,
  onBack,
}) => {
  const {
    editorContainerId,
    blocksContainerId,
    styleManagerContainerId,
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
  } = useTemplateBuilder({ initialPayload: initialTemplate, onSave });

  const [activeTab, setActiveTab] = useState<"blocks" | "styles">("blocks");
  const [activeDevice, setActiveDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [importTab, setImportTab] = useState<"json" | "html">("json");
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarExample, setNewVarExample] = useState("");
  const [varPanelOpen, setVarPanelOpen] = useState(true);

  // useEffect(() => {
  //   return mountEditor();
  // }, [mountEditor]);
useEffect(() => {
  const cleanup = mountEditor();

  const timer = setTimeout(() => {
    const categories = document.querySelectorAll(
      `#${blocksContainerId} .gjs-block-category`
    );

    categories.forEach((category) => {
      const title = category.querySelector(
        ".gjs-block-category__title"
      );

      if (!title) return;

      title.addEventListener("click", () => {
        category.classList.toggle("gjs-open");
      });
    });
  }, 300);

  return () => {
    clearTimeout(timer);

    if (typeof cleanup === "function") {
      cleanup();
    }
  };
}, [mountEditor, blocksContainerId]);
  
  const switchDevice = useCallback(
    (device: "Desktop" | "Tablet" | "Mobile") => {
      setDevice(device);
      setActiveDevice(device);
    },
    [setDevice]
  );

  const handleCopyHtml = useCallback(async () => {
    const copied = await copyHtmlToClipboard();
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }, [copyHtmlToClipboard]);

  const handleAddVariable = useCallback(() => {
    const added = addCustomVariable(newVarKey, newVarLabel, newVarExample);
    if (!added) return;

    setNewVarKey("");
    setNewVarLabel("");
    setNewVarExample("");
  }, [addCustomVariable, newVarExample, newVarKey, newVarLabel]);

  const handleVariableKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") handleAddVariable();
    },
    [handleAddVariable]
  );

  const saveDisabled =
    !state.templateKey.trim() || !state.templateName.trim() || state.isSaving;
  const variableButtonDisabled = !newVarKey.trim();
  const deviceButtons = useMemo(
    () => [
      { key: "Desktop" as const, icon: iconPaths.desktop },
      { key: "Tablet" as const, icon: iconPaths.tablet },
      { key: "Mobile" as const, icon: iconPaths.mobile },
    ],
    []
  );

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    minHeight: 34,
    background: active ? colors.primarySoft : "transparent",
    border: `1px solid ${active ? colors.borderStrong : "transparent"}`,
    borderRadius: 7,
    color: active ? "#c7d2fe" : colors.muted,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
  });

  return (
    <>
      <style>{`
        #tb-root * { box-sizing: border-box; }
        #tb-root button:focus-visible,
        #tb-root input:focus-visible,
        #tb-root textarea:focus-visible {
          outline: 2px solid rgba(129, 140, 248, 0.72);
          outline-offset: 2px;
        }
        #tb-root .gjs-cv-canvas { background: #eef2f7 !important; }
        #tb-root .gjs-frame-wrapper { margin: 0 auto; box-shadow: 0 18px 55px rgba(15, 23, 42, 0.18); }
        #tb-root .gjs-toolbar { background: #111827 !important; border-radius: 7px !important; }
        #tb-root .gjs-toolbar-item { color: #c7d2fe !important; }
        #tb-root .gjs-selected { outline: 2px solid #4f46e5 !important; outline-offset: 1px; }
        #tb-root .gjs-hovered { outline: 1px dashed #818cf8 !important; }
        #${blocksContainerId} .gjs-blocks-c { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; }
        #${blocksContainerId} .gjs-block-category__title {
  padding: 10px 12px 6px !important;
  color: #94a3b8 !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  border-top: 1px solid rgba(148, 163, 184, 0.12) !important;
  /* ADD these three: */
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  cursor: pointer !important;
}

#${blocksContainerId} .gjs-block-category__title::after {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 200ms ease;
  flex-shrink: 0;
}
#${blocksContainerId} .gjs-block-category.open .gjs-block-category__title::after {
  transform: rotate(180deg);
}

#${blocksContainerId} .gjs-block-category .gjs-blocks-c {
display: none;
}

#${blocksContainerId} .gjs-block-category.gjs-open .gjs-block-c {
  display: grid !important;
}


        #${blocksContainerId} .gjs-block {
          width: auto !important;
          min-height: 68px !important;
          margin: 0 !important;
          padding: 10px 8px !important;
          border: 1px solid rgba(148, 163, 184, 0.14) !important;
          border-radius: 8px !important;
          background: rgba(255,255,255,0.045) !important;
          color: #cbd5e1 !important;
          box-shadow: none !important;
          transition: background 140ms ease, border-color 140ms ease, color 140ms ease !important;
        }
        #${blocksContainerId} .gjs-block:hover {
          background: rgba(79, 70, 229, 0.14) !important;
          border-color: rgba(129, 140, 248, 0.42) !important;
          color: #c7d2fe !important;
        }
        #${blocksContainerId} .gjs-block__media { color: inherit !important; margin-bottom: 4px !important; }
        #${blocksContainerId} .gjs-block-label { font-size: 11px !important; line-height: 1.2 !important; }
        #${blocksContainerId} .gjs-block-category__title {
          padding: 10px 12px 6px !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          border-top: 1px solid rgba(148, 163, 184, 0.12) !important;
        }
        #${styleManagerContainerId} { height: calc(100% - 44px); overflow: auto; padding: 8px 10px 12px; color: #cbd5e1; }
        #${styleManagerContainerId} .gjs-sm-sector { border-bottom: 1px solid rgba(148, 163, 184, 0.13) !important; }
        #${styleManagerContainerId} .gjs-sm-sector-title { background: transparent !important; color: #cbd5e1 !important; font-weight: 800 !important; }
        #${styleManagerContainerId} .gjs-field { background: rgba(15, 23, 42, 0.55) !important; border: 1px solid rgba(148, 163, 184, 0.16) !important; }
        #tb-sidebar-scroll::-webkit-scrollbar,
        #${styleManagerContainerId}::-webkit-scrollbar { width: 6px; }
        #tb-sidebar-scroll::-webkit-scrollbar-thumb,
        #${styleManagerContainerId}::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 999px; }
      `}</style>

       {/* <div
        style={{
          width:"100%",
          display: "flex",
          justifyContent:"center",
          minHeight: "100vh",
          overflow:"auto",
          background: "#0b1120",
        }}
      > */}

      <div
        id="tb-root"
        style={{
          display: "flex",
          width: "100%",
          maxWidth:'1600px',
          flexDirection: "column",
          height: "calc(100vh-48px)",
          minHeight: 700,
          background: colors.bg,
          overflow:'hidden',
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 58,
            padding: "0 14px",
            background: "#151827",
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {onBack && (
            <ToolbarButton icon={iconPaths.back} title="Back" variant="ghost" onClick={onBack}>
              Back
            </ToolbarButton>
          )}

          <div style={{ minWidth: 0, marginRight: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>
              HTML Template Builder
            </div>
            <div style={{ fontSize: 12, color: colors.muted }}>
              {state.templateName || "Untitled template"}
              {state.version > 1 ? ` - version ${state.version}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, padding: 4, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
            {deviceButtons.map((device) => (
              <button
                key={device.key}
                type="button"
                title={device.key}
                aria-label={device.key}
                onClick={() => switchDevice(device.key)}
                style={{
                  ...buttonStyle(activeDevice === device.key ? "primary" : "ghost"),
                  width: 34,
                  minHeight: 30,
                  padding: 0,
                  boxShadow: "none",
                }}
              >
                <Icon path={device.icon} />
              </button>
            ))}
          </div>

          <ToolbarButton icon={iconPaths.undo} title="Undo" onClick={undo} />
          <ToolbarButton icon={iconPaths.redo} title="Redo" onClick={redo} />
          <ToolbarButton
            icon={iconPaths.import}
            title="Import"
            onClick={() => patch({ isImportModalOpen: true, importError: "" })}
          >
            Import
          </ToolbarButton>
          <ToolbarButton icon={iconPaths.preview} title="Preview" onClick={openPreview}>
            Preview
          </ToolbarButton>
          <ToolbarButton icon={iconPaths.copy} title="Copy HTML" onClick={handleCopyHtml}>
            {copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : "Copy HTML"}
          </ToolbarButton>
          <ToolbarButton
            icon={iconPaths.save}
            title="Save template"
            variant="primary"
            onClick={() => patch({ isSaveModalOpen: true, saveError: "" })}
          >
            Save
          </ToolbarButton>
        </header>

        <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
          <aside style={sidebarStyle}>
            <div style={{ display: "flex", gap: 6, padding: "14px 14px 0" }}>
              <button type="button" onClick={() => setActiveTab("blocks")} style={sidebarTabButtonStyle(activeTab === "blocks")}>
                Blocks
              </button>
              <button type="button" onClick={() => setActiveTab("styles")} style={sidebarTabButtonStyle(activeTab === "styles")}>
                Styles
              </button>
            </div>

            <div
              id="tb-sidebar-scroll"
              style={{
                display: activeTab === "blocks" ? "block" : "none",
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              }}
            >
                <div id={blocksContainerId} />

                <section style={sidebarSectionStyle}>
                  <button
                    type="button"
                    onClick={() => setVarPanelOpen((open) => !open)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 36,
                      background: "transparent",
                      border: 0,
                      color: colors.text,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    <span>Add Custom Variable</span>
                    <Icon path={varPanelOpen ? iconPaths.close : iconPaths.plus} size={14} />
                  </button>

                  {varPanelOpen && (
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      <input
                        style={inputStyle}
                        placeholder="Variable key, e.g. invoiceId"
                        value={newVarKey}
                        onChange={(event) => setNewVarKey(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Label, e.g. Invoice ID"
                        value={newVarLabel}
                        onChange={(event) => setNewVarLabel(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Preview value"
                        value={newVarExample}
                        onChange={(event) => setNewVarExample(event.target.value)}
                        onKeyDown={handleVariableKeyDown}
                      />
                      <button
                        type="button"
                        disabled={variableButtonDisabled}
                        onClick={handleAddVariable}
                        style={{
                          ...buttonStyle("primary", variableButtonDisabled),
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        <Icon path={iconPaths.plus} />
                        Add Variable
                      </button>
                    </div>
                  )}
                </section>

                <section style={{ borderTop: `1px solid ${colors.border}`, padding: "12px 10px 16px" }}>
                  <h3 style={{ margin: "0 0 9px", color: colors.muted, fontSize: 12 }}>
                    Quick Insert Variables
                  </h3>
                  <div style={{ display: "grid", gap: 5 }}>
                    {allVariables.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        title={`Insert {{${variable.key}}}`}
                        onClick={() => insertVariableAtCursor(variable)}
                        style={{
                          ...sidebarCardButtonStyle,
                          color: colors.text,
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {variable.label}
                        </span>
                        <code
                          style={{
                            flexShrink: 0,
                            color: "#f59e0b",
                            background: "rgba(245, 158, 11, 0.12)",
                            borderRadius: 5,
                            padding: "2px 5px",
                            fontSize: 11,
                          }}
                        >
                          {`{{${variable.key}}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            <div
              style={{
                display: activeTab === "styles" ? "block" : "none",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
                <div style={{ padding: "12px 12px 0", color: colors.subtle, fontSize: 12 }}>
                  Select an element on the canvas to edit its styles.
                </div>
                <div id={styleManagerContainerId} />
              </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0, overflow: "hidden", background: "#e5e7eb" }}>
            <div id={editorContainerId} style={{ width: "100%", height: "100%" }} />
          </main>
        </div>
      </div>

      <Modal
        open={state.isSaveModalOpen}
        onClose={() => patch({ isSaveModalOpen: false, saveError: "" })}
        title="Save Template"
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Template Name</label>
            <input
              autoFocus
              style={inputStyle}
              placeholder="Enter Template Name "
              value={state.templateName}
              onChange={(event) =>
                patch({ templateName: event.target.value, saveError: "" })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Template Key</label>
            <input
              style={{ ...inputStyle, fontFamily: "Consolas, monospace" }}
              placeholder="template_key"
              value={state.templateKey}
              onChange={(event) =>
                patch({
                  templateKey: normalizeTemplateKey(event.target.value),
                  saveError: "",
                })
              }
            />
          </div>

          {state.saveError && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                color: "#fecaca",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(248, 113, 113, 0.28)",
                borderRadius: 7,
                padding: 10,
                fontSize: 12,
              }}
            >
              <Icon path={iconPaths.warning} />
              <span>{state.saveError}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => patch({ isSaveModalOpen: false, saveError: "" })}
              style={buttonStyle("default")}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveDisabled}
              onClick={() => void save(state.templateKey, state.templateName)}
              style={buttonStyle("primary", saveDisabled)}
            >
              {state.isSaving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={state.isImportModalOpen}
        onClose={() => patch({ isImportModalOpen: false, importError: "" })}
        title="Import Template"
        width={560}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setImportTab("json")} style={tabButtonStyle(importTab === "json")}>
              Project JSON
            </button>
            <button type="button" onClick={() => setImportTab("html")} style={tabButtonStyle(importTab === "html")}>
              HTML
            </button>
          </div>

          <textarea
            style={{
              ...inputStyle,
              minHeight: 220,
              resize: "vertical",
              lineHeight: 1.55,
              fontFamily: "Consolas, monospace",
            }}
            placeholder={importTab === "json" ? '{ "pages": [], "styles": [] }' : "<table>...</table>"}
            value={importTab === "json" ? state.importJson : state.importHtml}
            onChange={(event) =>
              patch(
                importTab === "json"
                  ? { importJson: event.target.value, importError: "" }
                  : { importHtml: event.target.value, importError: "" }
              )
            }
          />

          {state.importError && (
            <div style={{ color: "#fecaca", fontSize: 12 }}>{state.importError}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={
                importTab === "json" ? !state.importJson.trim() : !state.importHtml.trim()
              }
              onClick={() =>
                importTab === "json"
                  ? importFromJson(state.importJson)
                  : importFromHtml(state.importHtml)
              }
              style={buttonStyle(
                "primary",
                importTab === "json" ? !state.importJson.trim() : !state.importHtml.trim()
              )}
            >
              {importTab === "json" ? "Load Project" : "Import HTML"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={state.isPreviewOpen} onClose={closePreview} title="Template Preview" width={760}>
        <div
          style={{
            height: 520,
            overflow: "hidden",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <iframe
            title="Template Preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            style={{ width: "100%", height: "100%", border: 0, background: "#ffffff" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default TemplateBuilderPage;





/*************************************/
useEffect(() => {
  const cleanup = mountEditor();

  const timer = setTimeout(() => {
    const categories = document.querySelectorAll(
      `#${blocksContainerId} .gjs-block-category`
    );

    categories.forEach((category) => {
      const title = category.querySelector(
        ".gjs-block-category__title"
      );

      if (!title) return;

      title.addEventListener("click", () => {
        category.classList.toggle("gjs-open");
      });
    });
  }, 300);

  return () => {
    clearTimeout(timer);

    if (typeof cleanup === "function") {
      cleanup();
    }
  };
}, [mountEditor, blocksContainerId]);
