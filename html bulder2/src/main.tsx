import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
/*************api slice ********************/
import { baseApi } from '@cib/redux-store'

interface Service {
  id: number
  batchServiceName: string
}

interface GetServicesResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: Service[]
}

interface UploadFileRequest {
  file: FormData
  serviceId: string
  valueDate: string
}

export interface BatchTransaction {
  accountNumber: string
  currency: string
  branch: string
  debit: string
  credit: string
  narrative: string
  valueDate: string
}

interface BatchUploadValue {
  id: string
  totalDebitAmount: string
  totalCreditAmount: string
  transactions: BatchTransaction[]
}

interface UploadResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: BatchUploadValue
}

interface SubmitBatchRequest {
  batchId: string
}

interface SubmitBatchResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: string
  message?: string
  path?: string
  errorCode?: string
}

interface CancelBatchRequest {
  batchId: string
}

interface CancelBatchResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: string
}

export interface StpFile {
  batchId: string
  seqId: number
  fileName: string
  uploadUser: string
  uploadDate: string
  totalTransactions: number
  batchStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  updatedBy?: string
  updatedDate?: string
}

export interface FileTransaction {
  accountNumber: string
  currency: string
  branch: string
  debit: string
  credit: string
  narrative: string
  valueDate: string
}

interface PageableResponse {
  pageNumber: number
  pageSize: number
  sort: {
    empty: boolean
    unsorted: boolean
    sorted: boolean
  }
  offset: number
  unpaged: boolean
  paged: boolean
}

interface StpFilesResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: {
    content: StpFile[]
    pageable: PageableResponse
    totalElements: number
    totalPages: number
    last: boolean
  }
}

interface StpFileDetailsResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: FileTransaction[]
}

interface ApproveFileRequest {
  batchId: string
  rejectionReason?: string
}

interface RejectFileRequest {
  batchId: string
  rejectionReason: string
}

interface FileActionResponse {
  success: boolean
  timestamp: string
  statusCode: number
  value: string
}

export const stpApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getUserServices: builder.query<GetServicesResponse, void>({
      query: () => ({
        url: '/payments/v1/users/services',
        method: 'GET',
      }),
    }),
    uploadStpFile: builder.mutation<UploadResponse, UploadFileRequest>({
      query: ({ file }) => {
        return {
          url: '/payments/v1/upload',
          method: 'POST',
          body: file,
        }
      },
    }),
    getStpFiles: builder.query<
      StpFilesResponse,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 10 } = {}) => ({
        url: `/payments/v1/batches?page=${page}&size=${size}`,
        method: 'GET',
      }),
    }),
    getStpFileDetails: builder.query<StpFileDetailsResponse, string>({
      query: batchId => ({
        url: `/payments/v1/batches/${batchId}/transactions`,
        method: 'GET',
      }),
    }),
    approveStpFile: builder.mutation<FileActionResponse, ApproveFileRequest>({
      query: ({ batchId, rejectionReason = '' }) => ({
        url: `/payments/v1/batches/${batchId}/approvals`,
        method: 'PUT',
        body: {
          batchStatus: 'APPROVED',
          rejectionReason,
        },
      }),
    }),
    rejectStpFile: builder.mutation<FileActionResponse, RejectFileRequest>({
      query: ({ batchId, rejectionReason }) => ({
        url: `/payments/v1/batches/${batchId}/approvals`,
        method: 'PUT',
        body: {
          batchStatus: 'REJECTED',
          rejectionReason,
        },
      }),
    }),
    submitBatch: builder.mutation<SubmitBatchResponse, SubmitBatchRequest>({
      query: ({ batchId }) => ({
        url: `/payments/v1/batches/${batchId}/submit`,
        method: 'POST',
      }),
    }),
    cancelBatch: builder.mutation<CancelBatchResponse, CancelBatchRequest>({
      query: ({ batchId }) => ({
        url: `/payments/v1/batches/${batchId}/cancel`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetUserServicesQuery,
  useUploadStpFileMutation,
  useGetStpFilesQuery,
  useGetStpFileDetailsQuery,
  useApproveStpFileMutation,
  useRejectStpFileMutation,
  useSubmitBatchMutation,
  useCancelBatchMutation,
} = stpApi
/*********************state slice**************************************/
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  sidebar: SideBarState
}

export interface SideBarState {
  collapsed: boolean
  activeItems?: string[]
}

const initialState: AppState = {
  sidebar: {
    collapsed: false,
    activeItems: [],
  },
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebar.collapsed = action.payload
    },
    triggerSidebarItemActive: (
      state,
      action: PayloadAction<{ isOpen: boolean; item: string }>,
    ) => {
      const { isOpen, item } = action.payload
      if (isOpen) {
        if (!state.sidebar.activeItems?.includes(item)) {
          state.sidebar.activeItems ||= []
          state.sidebar.activeItems?.push(item)
        }
      } else {
        state.sidebar.activeItems = state.sidebar.activeItems?.filter(
          i => i !== item,
        )
      }
    },
  },
  selectors: {
    sidebarCollapsed: state => state.sidebar.collapsed,
    sidebarActiveItems: state => state.sidebar.activeItems,
  },
})

export const { toggleSidebar, triggerSidebarItemActive } = appSlice.actions
export const { sidebarCollapsed, sidebarActiveItems } = appSlice.selectors
export const appReducer = appSlice.reducer

/************store.ts*********************************/
import {
  combineReducers,
  configureStore,
  createDynamicMiddleware,
  Middleware,
  Reducer,
} from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { persistReducer, persistStore } from 'redux-persist'

import { baseApi } from './baseApi'
import { idpApi } from './idpApi'
import storage from './storage'

const asyncReducers: Record<string, Reducer> = {}

const dynamicWhitelist: string[] = []

function createPersistConfig() {
  return {
    key: 'root',
    storage,
    whitelist: [...dynamicWhitelist],
  }
}

function createPersistedReducer() {
  return persistReducer(createPersistConfig(), createRootReducer())
}

function createRootReducer() {
  const staticReducers = {
    [baseApi.reducerPath]: baseApi.reducer,
    [idpApi.reducerPath]: idpApi.reducer,
  }
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  })
}

export const dynamicMiddleware = createDynamicMiddleware()

export const store = configureStore({
  reducer: createPersistedReducer(),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    })
      .concat(baseApi.middleware as Middleware, idpApi.middleware as Middleware)
      .prepend(dynamicMiddleware.middleware),
})

export const persistor = persistStore(store)

export const reducerManager = {
  add: (key: string, reducer: Reducer, persist = false) => {
    if (!key || asyncReducers[key]) return
    asyncReducers[key] = reducer
    if (persist) {
      dynamicWhitelist.push(key)
    }
    const newReducer = createPersistedReducer()
    store.replaceReducer(newReducer)
  },
}
setupListeners(store.dispatch)

export type AppStore = typeof store
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
export type DynamicReducer = typeof reducerManager
//////////////////////////////////////***************new templates *****************/
'use client'

import { toast } from '@cib/design-system-components'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { reducerManager } from '../state/store'
import builderResultReducer, { clearBuilderResult } from '../state/builderSlice'
import type { RootState } from '../state/store'
import {
  MessageTemplate,
  useGetMessageTemplatesQuery,
} from '../state/templatesSlice'
import { TemplateEditor } from './components/Templates/TemplateEditor'

// Register once — safe to call multiple times, reducerManager guards duplicates
reducerManager.add('builderResult', builderResultReducer)

export function NewTemplatePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const builderResult = useSelector(
    (s: RootState & { builderResult: { html: string | null; languageId: number | null } }) =>
      s.builderResult
  )
  const [pendingHtml, setPendingHtml] = useState<string | undefined>()

  useEffect(() => {
    if (!builderResult?.html) return
    setPendingHtml(builderResult.html)
    dispatch(clearBuilderResult())
  }, [builderResult?.html, dispatch])

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
      html={pendingHtml}
    />
  )
}
