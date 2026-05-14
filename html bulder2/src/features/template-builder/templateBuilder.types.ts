export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
}

export interface GrapesProjectJSON {
  pages?: unknown[];
  styles?: unknown[];
  assets?: unknown[];
  [key: string]: unknown;
}

export interface TemplateSavePayload {
  templateKey: string;
  name: string;
  version: number;
  html: string;
  project: GrapesProjectJSON;
  variables: string[];
}

export interface TemplateRecord extends TemplateSavePayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBuilderState {
  templateKey: string;
  templateName: string;
  version: number;
  isSaving: boolean;
  isPreviewOpen: boolean;
  isSaveModalOpen: boolean;
  isImportModalOpen: boolean;
  customVariables: TemplateVariable[];
  importJson: string;
  importHtml: string;
  importError: string;
  saveError: string;
  
}

export const DEFAULT_VARIABLES: TemplateVariable[] = [
  { key: "name", label: "Full Name", example: "Ali Ahmed" },
  { key: "firstName", label: "First Name", example: "Ali" },
  { key: "email", label: "Email Address", example: "Ali@example.com" },
  { key: "amount", label: "Amount", example: "$250.00" },
  { key: "date", label: "Date", example: "May 8, 2026" },
  { key: "orderId", label: "Order ID", example: "#ORD-10045" },
  { key: "companyName", label: "Company Name", example: "CIB" },
  { key: "link", label: "Action Link", example: "https://example.com" },
];

/**************builder Slice*********/
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface BuilderResultState {
  html: string | null;
  languageId: number | null;
}

const initialState: BuilderResultState = { html: null, languageId: null };

export const builderSlice = createSlice({
  name: "builderResult",
  initialState,
  reducers: {
    setBuilderResult(
      state,
      action: PayloadAction<{ html: string; languageId: number }>
    ) {
      state.html = action.payload.html;
      state.languageId = action.payload.languageId;
    },
    clearBuilderResult(state) {
      state.html = null;
      state.languageId = null;
    },
  },
});

export const { setBuilderResult, clearBuilderResult } = builderSlice.actions;
export default builderSlice.reducer;
