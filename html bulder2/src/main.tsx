import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
/*************builder slice ********************/
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface BuilderResultState {
  html: string | null
  languageId: number | null
  pendingLoad: { html: string } | null // html going INTO the builder
}

const initialState: BuilderResultState = {
  html: null,
  languageId: null,
  pendingLoad: null,
}

export const builderSlice = createSlice({
  name: 'builderResult',
  initialState,
  reducers: {
    setBuilderResult(
      state,
      action: PayloadAction<{ html: string; languageId: number }>
    ) {
      state.html = action.payload.html
      state.languageId = action.payload.languageId
    },
    clearBuilderResult(state) {
      state.html = null
      state.languageId = null
    },
    setBuilderPendingLoad(state, action: PayloadAction<{ html: string }>) {
      state.pendingLoad = action.payload
    },
    clearBuilderPendingLoad(state) {
      state.pendingLoad = null
    },
  },
})

export const {
  setBuilderResult,
  clearBuilderResult,
  setBuilderPendingLoad,
  clearBuilderPendingLoad,
} = builderSlice.actions

export default builderSlice.reducer/

*********************Builder page **************************************/
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useRef } from 'react'
import {
  setBuilderResult,
  clearBuilderPendingLoad,
} from '@/state/builderSlice'
import { reducerManager } from '@/state/store'
import builderResultReducer from '@/state/builderSlice'
import type { RootState } from '@/state/store'
import { TemplateBuilderPage } from '@/components/template-builder/TemplateBuilderPage'
import type { TemplateSavePayload } from '@/components/template-builder/templateBuilder.types'

reducerManager.add('builderResult', builderResultReducer)

export default function TemplateBuilderRoute() {
  const router = useRouter()
  const dispatch = useDispatch()
  const params = useSearchParams()
  const languageId = Number(params.get('languageId') ?? 1)

  const pendingLoad = useSelector(
    (s: RootState) =>
      (s as any).builderResult?.pendingLoad as { html: string } | null
  )

  // Build initialTemplate from pendingLoad so GrapesJS loads the existing HTML
  const initialTemplate: TemplateSavePayload | null = pendingLoad
    ? {
        templateKey: '',
        name: '',
        version: 1,
        html: pendingLoad.html,
        project: null,   // no project data, builder will use importFromHtml
        variables: [],
      }
    : null

  // Clear pendingLoad once consumed so it doesn't re-apply on re-render
  const consumed = useRef(false)
  useEffect(() => {
    if (pendingLoad && !consumed.current) {
      consumed.current = true
      dispatch(clearBuilderPendingLoad())
    }
  }, [pendingLoad, dispatch])

  return (
    <TemplateBuilderPage
      initialTemplate={initialTemplate}
      onBack={() => router.back()}
      onSave={async (payload) => {
        dispatch(setBuilderResult({ html: payload.html, languageId }))
        router.back()
      }}
    />
  )
}/

************note*********************************/
// existing block:
if (initialPayload?.project) {
  try {
    editor.loadProjectData(initialPayload.project as ...)
  } catch (error) {
    console.error("[TemplateBuilder] Could not load project data", error)
  }
// ADD this else-if:
} else if (initialPayload?.html) {
  try {
    const imported = parseImportedHtml(initialPayload.html)
    editor.setComponents(imported.components)
    if (imported.styles) editor.setStyle(imported.styles)
  } catch (error) {
    console.error("[TemplateBuilder] Could not load html", error)
  }
}
/*********************/

// At the top of ChannelTemplateEditors, add dispatch import
import { useDispatch } from 'react-redux'
import { reducerManager } from '../../../state/store'
import builderResultReducer, {
  setBuilderPendingLoad,
} from '../../../state/builderSlice'

reducerManager.add('builderResult', builderResultReducer)

// Inside the component:
function ChannelTemplateEditors({ ... }: ChannelTemplateEditorsProps) {
  const dispatch = useDispatch()
  // ...existing code...

  // Replace the inbox section's button with this:
  const inboxBodyValue = currentInbox?.text ?? ''
  const hasBuilderContent = inboxBodyValue.trim().startsWith('<')

  const handleOpenBuilder = () => {
    if (hasBuilderContent) {
      // Load existing HTML into builder before navigating
      dispatch(setBuilderPendingLoad({ html: inboxBodyValue }))
    }
    router.push(
      `/notifications/templates/template-builder?languageId=${activeLangId}`
    )
  }

  // ...

  // In the inbox channel JSX, replace the Button + Body textarea with:
  {activeChannel === 'inbox' && (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <InboxIcon />
          <span className="font-medium">Inbox</span>
          <span className="text-xs text-muted-foreground">
            {currentInbox ? 'Using specific template' : 'Using generic template'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={hasBuilderContent ? 'outline' : 'default'}
            onClick={handleOpenBuilder}
          >
            {hasBuilderContent ? 'Edit in Builder' : 'Open Template Builder'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Use specific template
          </span>
          <Switch checked={!!currentInbox} onCheckedChange={toggleInbox} />
        </div>
      </div>

      {currentInbox && currentInboxIndex > -1 && (
        <>
          <div className="space-y-1.5">
            <FieldLabel>Subject</FieldLabel>
            <Input
              placeholder="Inbox message subject..."
              {...register(`inboxTemplates.${currentInboxIndex}.subject`)}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Summary</FieldLabel>
            <Textarea
              rows={4}
              placeholder="Inbox summary..."
              {...register(`inboxTemplates.${currentInboxIndex}.summary`)}
            />
          </div>

          {/* Body — preview if from builder, textarea if manual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel>Body</FieldLabel>
              {hasBuilderContent && (
                <span className="text-xs text-muted-foreground">
                  Built with Template Builder
                </span>
              )}
            </div>

            {hasBuilderContent ? (
              // Show a live preview of the HTML
              <div className="rounded-md border overflow-hidden h-48">
                <iframe
                  title="Body preview"
                  srcDoc={inboxBodyValue}
                  sandbox="allow-same-origin"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            ) : (
              <Textarea
                rows={8}
                placeholder="Inbox message body or open builder above..."
                {...register(`inboxTemplates.${currentInboxIndex}.text`)}
              />
            )}

            {/* Hidden input keeps the value in the form when preview is shown */}
            {hasBuilderContent && (
              <input
                type="hidden"
                {...register(`inboxTemplates.${currentInboxIndex}.text`)}
              />
            )}
          </div>
        </>
      )}
    </div>
  )}



  /************************/
