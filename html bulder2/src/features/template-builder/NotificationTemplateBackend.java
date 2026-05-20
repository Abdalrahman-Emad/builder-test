import { baseApi } from '@cib/redux-store'

import { CAMPAIGN_BASE } from './constants'
import type { CursorPage } from './types'

const CAMPAIGNS_URL = `${CAMPAIGN_BASE}/notifications/v1/campaigns`
const AUDIENCES_URL = `${CAMPAIGN_BASE}/notifications/v1/audiences`

interface SingleResponse<T> {
  data: T
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  DISPATCH_FAILED = 'DISPATCH_FAILED',
}

export type CampaignChannel = 'SMS' | 'PUSH' | 'INBOX'
export type CampaignDispatchLogic = 'FIRST_MATCHED' | 'ALL' | 'ONLY_SELECTED'
export type CampaignType = 'GENERAL'
export type UserAssociation = 'ANONYMOUS' | 'REGISTERED'

export interface CampaignResponseDto {
  id: number
  name: string
  description: string | null
  templateId: number | null
  type: CampaignType | null
  status: CampaignStatus
  persist: boolean
  dispatchLogic: CampaignDispatchLogic | null
  audienceMode: 'OPEN' | 'CLOSED' | null
  scheduledAt: string | null
  createdAt: string | null
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  authorizations: CampaignAuthorizationDto[]
  channels: CampaignChannel[]
  audienceIds: number[]
  recipientCount: number
  audienceMemberCount: number
  audienceWarning: string | null
  userAssociations: UserAssociation[]
}

export interface CampaignAuthorizationDto {
  id: number
  campaignId: number
  status: 'APPROVED' | 'REJECTED'
  reason: string | null
  createdAt: string
  createdBy: string
}

export interface CampaignRequestDto {
  name: string
  description?: string
  templateId?: number
  type?: CampaignType
  channels?: CampaignChannel[]
  isPersist?: boolean
  dispatchLogic?: CampaignDispatchLogic
  scheduledAt?: string
  audienceIds?: number[]
  audienceMode?: 'OPEN' | 'CLOSED'
}

export interface CampaignSearchRequest {
  name?: string
  statuses?: CampaignStatus[]
  templateId?: number
  createdBy?: string
  createdFrom?: string
  createdTo?: string
}

export interface CampaignCursorQuery {
  cursor?: string
  size?: number
  search?: CampaignSearchRequest
}

export interface AudienceResponseDto {
  id: number
  name: string
  description: string | null
  memberCount: number
  /**
   * 'QUERY' means members are resolved dynamically; 'UPLOAD' means the
   * audience was populated via an uploaded file and campaigns using it
   * must be treated as CLOSED.
   */
  type?: 'QUERY' | 'UPLOAD'
  createdAt: string | null
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
}

export const campaignsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Campaign'] })
  .injectEndpoints({
    endpoints: builder => ({
      getCampaigns: builder.query<
        CursorPage<CampaignResponseDto>,
        CampaignCursorQuery | void
      >({
        query: args => {
          const { cursor, size, search } = args ?? {}
          const params: Record<string, string> = {}

          if (cursor) params.cursor = cursor
          if (size !== undefined) params.size = String(size)

          if (search) {
            Object.entries(search).forEach(([key, value]) => {
              if (value === undefined || value === null) return
              if (Array.isArray(value)) {
                if (value.length > 0) params[key] = value.join(',')
              } else {
                params[key] = String(value)
              }
            })
          }

          return {
            url: CAMPAIGNS_URL,
            method: 'GET',
            params,
          }
        },
        serializeQueryArgs: ({ endpointName }) => endpointName,
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg
        },
        merge: (currentCache, newItems, { arg }) => {
          if (!arg?.cursor) {
            return newItems
          }
          return {
            ...newItems,
            data: [...currentCache.data, ...newItems.data],
          }
        },
        providesTags: result =>
          result?.data
            ? [
                ...result.data.map(c => ({
                  type: 'Campaign' as const,
                  id: c.id,
                })),
                { type: 'Campaign', id: 'LIST' },
              ]
            : [{ type: 'Campaign', id: 'LIST' }],
      }),

      getCampaignById: builder.query<
        SingleResponse<CampaignResponseDto>,
        string
      >({
        query: id => ({
          url: `${CAMPAIGNS_URL}/${id}`,
          method: 'GET',
        }),
        providesTags: (_result, _error, id) => [{ type: 'Campaign', id }],
      }),

      createCampaign: builder.mutation<CampaignResponseDto, CampaignRequestDto>(
        {
          query: body => ({
            url: CAMPAIGNS_URL,
            method: 'POST',
            body,
          }),
          invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
        },
      ),

      updateCampaign: builder.mutation<
        CampaignResponseDto,
        { id: string; body: CampaignRequestDto }
      >({
        query: ({ id, body }) => ({
          url: `${CAMPAIGNS_URL}/${id}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Campaign', id },
          { type: 'Campaign', id: 'LIST' },
        ],
      }),

      submitCampaign: builder.mutation<CampaignResponseDto, string>({
        query: id => ({
          url: `${CAMPAIGNS_URL}/${id}/submit`,
          method: 'POST',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Campaign', id },
          { type: 'Campaign', id: 'LIST' },
        ],
      }),

      approveCampaign: builder.mutation<CampaignResponseDto, string>({
        query: id => ({
          url: `${CAMPAIGNS_URL}/${id}/approve`,
          method: 'POST',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Campaign', id },
          { type: 'Campaign', id: 'LIST' },
        ],
      }),

      rejectCampaign: builder.mutation<
        CampaignResponseDto,
        { id: string; reason?: string }
      >({
        query: ({ id, reason }) => ({
          url: `${CAMPAIGNS_URL}/${id}/reject`,
          method: 'POST',
          body: { reason },
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Campaign', id },
          { type: 'Campaign', id: 'LIST' },
        ],
      }),

      deleteCampaign: builder.mutation<void, string>({
        query: id => ({
          url: `${CAMPAIGNS_URL}/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Campaign', id },
          { type: 'Campaign', id: 'LIST' },
        ],
      }),

      getCampaignsAsCSV: builder.query<
        { blob: Blob; filename: string },
        CampaignSearchRequest
      >({
        query: params => ({
          url: CAMPAIGNS_URL,
          method: 'GET',
          headers: { Accept: 'text/csv' },
          params,
          responseHandler: async response => {
            const blob = await response.blob()
            const disposition = response.headers.get('Content-Disposition')
            let filename = 'campaigns.csv'
            if (disposition) {
              const match = disposition.match(/filename="(.+)"/)
              if (match?.[1]) {
                filename = match[1]
              }
            }
            return { blob, filename }
          },
        }),
      }),

      getCampaignAudiences: builder.query<
        CursorPage<AudienceResponseDto>,
        { cursor?: string; size?: number } | void
      >({
        query: args => ({
          url: AUDIENCES_URL,
          method: 'GET',
          params: args ?? { size: 1000 },
        }),
      }),
    }),
  })

export const {
  useGetCampaignsQuery,
  useGetCampaignByIdQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useSubmitCampaignMutation,
  useApproveCampaignMutation,
  useRejectCampaignMutation,
  useDeleteCampaignMutation,
  useLazyGetCampaignsAsCSVQuery,
  useGetCampaignAudiencesQuery,
} = campaignsApi
/*******constant******************/
    export const CAMPAIGN_LABEL_VALUES = [
  'NEW_PRODUCT',
  'SYSTEM_OUTAGE',
  'CC_TRANSACTION',
  'OFFER',
  'ATM_WITHDRAWAL',
  'ANNOUNCEMENT',
  'TRANSACTIONAL',
] as const

export type CampaignLabel = (typeof CAMPAIGN_LABEL_VALUES)[number]

export const CAMPAIGN_LABEL_OPTIONS: {
  value: CampaignLabel
  label: string
  desc: string
  mutualExcl?: true
}[] = [
  { value: 'NEW_PRODUCT',    label: 'New Product',             desc: 'Announce a newly launched product or feature' },
  { value: 'SYSTEM_OUTAGE',  label: 'System Outage',           desc: 'Alert customers about a service disruption'   },
  { value: 'CC_TRANSACTION', label: 'Credit Card Transaction', desc: 'Notification for card activity'               },
  { value: 'OFFER',          label: 'Offer',                   desc: 'Promotions, discounts, and special deals'     },
  { value: 'ATM_WITHDRAWAL', label: 'ATM Withdrawal',          desc: 'Alert for cash withdrawal events'             },
  { value: 'ANNOUNCEMENT',   label: 'Announcement',            desc: 'General broadcast communications', mutualExcl: true },
  { value: 'TRANSACTIONAL',  label: 'Transactional Note',      desc: 'Receipts and transaction confirmations', mutualExcl: true },
]

export const MUTUALLY_EXCLUSIVE_LABELS = ['TRANSACTIONAL', 'ANNOUNCEMENT'] as const

export function isMutuallyBlocked(
  value: CampaignLabel,
  selected: CampaignLabel[],
): boolean {
  if (!MUTUALLY_EXCLUSIVE_LABELS.includes(value as typeof MUTUALLY_EXCLUSIVE_LABELS[number])) return false
  return MUTUALLY_EXCLUSIVE_LABELS
    .filter(v => v !== value)
    .some(v => selected.includes(v as CampaignLabel))
}
/******************steo 3*******/
labels: z
  .array(z.enum(CAMPAIGN_LABEL_VALUES))
  .min(1, { message: 'Select at least one label' })
  .refine(
    vals => !(vals.includes('TRANSACTIONAL') && vals.includes('ANNOUNCEMENT')),
    { message: 'Transactional Note and Announcement cannot be selected together' },
  ),

/*******step4**************/
const [templateOpen, setTemplateOpen] = useState(false)
const [templateSearch, setTemplateSearch] = useState('')
const [audienceOpen, setAudienceOpen] = useState(false)
const [audienceSearch, setAudienceSearch] = useState('')
// ✅ add here, same group
const [labelOpen, setLabelOpen] = useState(false)
const [labelSearch, setLabelSearch] = useState('')

const filteredTemplates = (templates?.data ?? []).filter(...)
const filteredAudiences = (audiencesData?.data ?? []).filter(...)
// ✅ add here, same group
const filteredLabelOptions = CAMPAIGN_LABEL_OPTIONS.filter(l =>
  l.label.toLowerCase().includes(labelSearch.toLowerCase()),
)
