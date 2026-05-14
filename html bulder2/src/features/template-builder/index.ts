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



/****************template page/page.tsx*********************/
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBuilderResult } from "@/state/builderSlice";
import { TemplateBuilderPage } from "@/components/template-builder/TemplateBuilderPage";

export default function TemplateBuilderRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useSearchParams();
  const languageId = Number(params.get("languageId") ?? 1);

  return (
    <TemplateBuilderPage
      onBack={() => router.back()}
      onSave={async (payload) => {
        dispatch(setBuilderResult({ html: payload.html, languageId }));
        router.back();
      }}
    />
  );
}

/*********************new template************/
'use client'

import { toast } from '@cib/design-system-components'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearBuilderResult } from '../state/builderSlice'
import type { RootState } from '../state/store'
import {
  MessageTemplate,
  useGetMessageTemplatesQuery,
} from '../state/templatesSlice'
import { TemplateEditor } from './components/Templates/TemplateEditor'

export function NewTemplatePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const builderResult = useSelector((s: RootState) => s.builderResult)
  const [pendingHtml, setPendingHtml] = useState<string | undefined>()

  useEffect(() => {
    if (!builderResult.html) return
    setPendingHtml(builderResult.html)
    dispatch(clearBuilderResult())
  }, [builderResult.html, dispatch])

  const handleSaved = (_saved: MessageTemplate) => {
    toast.success('Template created successfully.')
    router.push('/notifications/templates')
  }

  const handleCancel = () => {
    router.push('/notifications/templates')
  }

  const { refetch } = useGetMessageTemplatesQuery({})

  return (
    <TemplateEditor
      onSaved={handleSaved}
      onCancel={handleCancel}
      refetch={refetch}
      html={pendingHtml}  // ← this is the only addition to the JSX
    />
  )
}
