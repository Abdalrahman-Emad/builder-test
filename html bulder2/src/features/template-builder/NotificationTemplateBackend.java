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


  /*******step5********************/
  <Field>
  <FieldLabel className="flex items-center gap-2">
    <Tag className="h-4 w-4 text-muted-foreground" />
    Labels
  </FieldLabel>
  <FieldDescription>
    Transactional Note and Announcement cannot be selected together.
  </FieldDescription>
  <FieldContent>
    <Controller
      name="labels"
      control={control}
      render={({ field }) => {
        const currentLabels = (field.value ?? []) as CampaignLabel[]

        const toggleLabel = (value: CampaignLabel) => {
          if (currentLabels.includes(value)) {
            field.onChange(currentLabels.filter(v => v !== value))
          } else {
            if (isMutuallyBlocked(value, currentLabels)) return
            field.onChange([...currentLabels, value])
          }
        }

        return (
          <>
            <Popover
              open={labelOpen}
              onOpenChange={open => {
                if (!readOnly) {
                  setLabelOpen(open)
                  if (!open) setLabelSearch('')
                }
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={readOnly}
                  className="w-full min-h-[38px] flex flex-wrap gap-1.5 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currentLabels.length > 0 ? (
                    <>
                      {currentLabels.map(val => {
                        const opt = CAMPAIGN_LABEL_OPTIONS.find(l => l.value === val)
                        if (!opt) return null
                        return (
                          <span
                            key={val}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {opt.label}
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  toggleLabel(val)
                                }}
                                className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                                aria-label={`Remove ${opt.label}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        )
                      })}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select labels...</span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-auto" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="p-0 min-w-[300px] w-[var(--radix-popover-trigger-width)]"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search labels..."
                    value={labelSearch}
                    onValueChange={setLabelSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No labels found.</CommandEmpty>
                    <CommandGroup>
                      {filteredLabelOptions.map(opt => {
                        const checked = currentLabels.includes(opt.value)
                        const blocked = !checked && isMutuallyBlocked(opt.value, currentLabels)
                        return (
                          <CommandItem
                            key={opt.value}
                            value={opt.label}
                            disabled={blocked}
                            onSelect={() => toggleLabel(opt.value)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 shrink-0 ${checked ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{opt.label}</span>
                              <p className="text-xs text-muted-foreground">
                                {opt.desc}
                              </p>
                            </div>
                            {opt.mutualExcl && (
                              <span className="ml-2 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                excl.
                              </span>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {hasLabelConflict && (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm animate-in fade-in duration-200 dark:border-amber-900 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-400">
                  <strong>Conflict:</strong> Transactional Note and Announcement
                  cannot be selected together. Please remove one.
                </p>
              </div>
            )}
          </>
        )
      }}
    />

    {errors.labels && (
      <FieldError>{errors.labels.message}</FieldError>
    )}
  </FieldContent>
</Field>
                                
                                
    /********campaign configure page*********
                                'use client'

import { toast } from '@cib/design-system-components'
import { useRouter } from 'next/navigation'

import { useCreateCampaignMutation, useSubmitCampaignMutation } from '../state'
import {
  CampaignConfigFormValues,
  CampaignConfigureForm,
} from './components/campaigns/campaign-configure-form'
import {
  CAMPAIGNS_ROUTE,
  campaignSaveErrorMessage,
} from './components/campaigns/utils'

export function CampaignConfigurePage() {
  const router = useRouter()
  const [createCampaign, { isLoading }] = useCreateCampaignMutation()
  const [submitCampaign] = useSubmitCampaignMutation()

  const save = async (values: CampaignConfigFormValues, submit?: boolean) => {
    try {
      const campaign = await createCampaign({
        name: `Campaign - ${new Date().toISOString().slice(0, 10)}`,
        templateId: Number(values.templateId),
        channels: values.channels,
        isPersist: values.isPersist,
        dispatchLogic: values.dispatchLogic,
        audienceIds: values.audienceIds,
        audienceMode: values.audienceMode,
      }).unwrap()
      if (submit) await submitCampaign(String(campaign.id)).unwrap()
      router.push(CAMPAIGNS_ROUTE)
    } catch {
      toast.error(campaignSaveErrorMessage(submit))
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-1">Campaign Configuration</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Orchestrate high-precision multi-channel outreach strategies.
      </p>
      <CampaignConfigureForm
        onSaveDraft={v => save(v)}
        onSubmitForApproval={v => save(v, true)}
        isSubmitting={isLoading}
      />
    </div>
  )
}



                                  /***********************/
                                      {/* Channels */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Select delivery channels</FieldLabel>
              <FieldDescription>
                Drag cards to set priority order. Check &quot;Select All&quot;
                to enable every channel.
              </FieldDescription>
              <FieldContent>
                {!readOnly && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer text-sm font-medium">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    Select All Channels
                  </label>
                )}

                <Controller
                  name="channels"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-3">
                      {orderedChannels.map((opt, idx) => {
                        const checked = field.value?.includes(opt.value);
                        return (
                          <div
                            key={opt.value}
                            draggable={!readOnly}
                            onDragStart={
                              readOnly ? undefined : (e) => onDragStart(e, idx)
                            }
                            onDragOver={
                              readOnly ? undefined : (e) => onDragOver(e, idx)
                            }
                            onDrop={readOnly ? undefined : onDrop}
                            onDragEnd={readOnly ? undefined : onDragEnd}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${
                              readOnly
                                ? "cursor-default"
                                : "cursor-grab active:cursor-grabbing hover:shadow-sm"
                            } ${dragIdx === idx ? "opacity-40 scale-95" : ""} ${
                              checked
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            {!readOnly && (
                              <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                            )}
                            <Checkbox
                              checked={checked}
                              disabled={readOnly}
                              onCheckedChange={(isChecked) => {
                                const next = isChecked
                                  ? [...(field.value || []), opt.value]
                                  : field.value?.filter(
                                      (v) => v !== opt.value,
                                    ) || [];
                                field.onChange(next);
                              }}
                            />
                            <opt.icon
                              className={`h-5 w-5 transition-colors ${checked ? "text-primary" : "text-muted-foreground"}`}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {opt.label}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {opt.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.channels && (
                  <FieldError>{errors.channels.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Dispatch Logic</FieldLabel>
              <FieldContent>
                <Controller
                  name="dispatchLogic"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-row gap-3">
                      {DISPATCH_OPTIONS.map(([v, l]) => {
                        const active = field.value === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            disabled={readOnly}
                            onClick={() => field.onChange(v)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              readOnly ? "cursor-default" : "cursor-pointer"
                            } ${
                              active
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary/30 text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full transition-colors ${
                                active ? "bg-primary" : "bg-muted-foreground/30"
                              }`}
                            />
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.dispatchLogic && (
                  <FieldError>{errors.dispatchLogic.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Persist Notifications</FieldLabel>
              <FieldDescription>
                Save delivered notifications in the mobile app inbox
              </FieldDescription>
              <FieldContent>
                <Controller
                  name="isPersist"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: true,
                          label: "Enabled",
                          desc: "Saved in mobile app inbox",
                        },
                        {
                          value: false,
                          label: "Disabled",
                          desc: "Not persisted after delivery",
                        },
                      ].map((opt) => {
                        const active = field.value === opt.value;
                        return (
                          <button
                            key={String(opt.value)}
                            type="button"
                            disabled={readOnly}
                            onClick={() => field.onChange(opt.value)}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 text-left ${
                              readOnly
                                ? "cursor-default"
                                : "cursor-pointer hover:shadow-sm"
                            } ${
                              active
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Smartphone
                              className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                            />
                            <div>
                              <span className="text-sm font-medium">
                                {opt.label}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Labels */}
      <Field>
        <FieldLabel className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Labels
        </FieldLabel>
        <FieldDescription>
          Transactional Note and Announcement cannot be selected together.
        </FieldDescription>
        <FieldContent>
          <Controller
            name="labels"
            control={control}
            render={({ field }) => {
              const currentLabels = (field.value ?? []) as CampaignLabel[];

              const toggleLabel = (value: CampaignLabel) => {
                if (currentLabels.includes(value)) {
                  field.onChange(currentLabels.filter((v) => v !== value));
                } else {
                  if (isMutuallyBlocked(value, currentLabels)) return;
                  field.onChange([...currentLabels, value]);
                }
              };

              return (
                <>
                  <Popover
                    open={labelOpen}
                    onOpenChange={(open) => {
                      if (!readOnly) {
                        setLabelOpen(open);
                        if (!open) setLabelSearch("");
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={readOnly}
                        className="w-full min-h-[38px] flex flex-wrap gap-1.5 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {currentLabels.length > 0 ? (
                          <>
                            {currentLabels.map((val) => {
                              const opt = CAMPAIGN_LABEL_OPTIONS.find(
                                (l) => l.value === val,
                              );
                              if (!opt) return null;
                              return (
                                <span
                                  key={val}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
                                >
                                  {opt.label}
                                  {!readOnly && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLabel(val);
                                      }}
                                      className="rounded-full hover:bg-primary/20 p-0.5 transition-colors cursor-pointer"
                                      aria-label={`Remove ${opt.label}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Select labels...
                          </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-auto" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="p-0 min-w-[300px] w-[var(--radix-popover-trigger-width)]"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search labels..."
                          value={labelSearch}
                          onValueChange={setLabelSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No labels found.</CommandEmpty>
                          <CommandGroup>
                            {filteredLabelOptions.map((opt) => {
                              const checked = currentLabels.includes(opt.value);
                              const blocked =
                                !checked &&
                                isMutuallyBlocked(opt.value, currentLabels);
                              return (
                                <CommandItem
                                  key={opt.value}
                                  value={opt.label}
                                  disabled={blocked}
                                  onSelect={() => toggleLabel(opt.value)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 shrink-0 ${checked ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">
                                      {opt.label}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      {opt.desc}
                                    </p>
                                  </div>
                                  {opt.mutualExcl && (
                                    <span className="ml-2 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                      excl.
                                    </span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {hasLabelConflict && (
                    <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm animate-in fade-in duration-200 dark:border-amber-900 dark:bg-amber-950/30">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-amber-800 dark:text-amber-400">
                        <strong>Conflict:</strong> Transactional Note and
                        Announcement cannot be selected together. Please remove
                        one.
                      </p>
                    </div>
                  )}
                </>
              );
            }}
          />

          {errors.labels && <FieldError>{errors.labels.message}</FieldError>}
        </FieldContent>
      </Field>

/***************enhanced label*****************/
            {/* Labels */}
<Field>
  <FieldLabel className="flex items-center gap-2">
    <Tag className="h-4 w-4 text-muted-foreground" />
    Labels
  </FieldLabel>
  <FieldDescription>
    Transactional Note and Announcement cannot be selected together.
  </FieldDescription>
  <FieldContent>
    <Controller
      name="labels"
      control={control}
      render={({ field }) => {
        const currentLabels = (field.value ?? []) as CampaignLabel[];

        const toggleLabel = (value: CampaignLabel) => {
          if (currentLabels.includes(value)) {
            field.onChange(currentLabels.filter((v) => v !== value));
          } else {
            if (isMutuallyBlocked(value, currentLabels)) return;
            field.onChange([...currentLabels, value]);
          }
        };

        return (
          <>
            <div className="grid grid-cols-1 gap-3">
              {CAMPAIGN_LABEL_OPTIONS.map((opt) => {
                const checked = currentLabels.includes(opt.value);
                const blocked =
                  !checked && isMutuallyBlocked(opt.value, currentLabels);

                return (
                  <div
                    key={opt.value}
                    onClick={() =>
                      !readOnly && !blocked && toggleLabel(opt.value)
                    }
                    className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${
                      readOnly || blocked
                        ? "cursor-default"
                        : "cursor-pointer hover:shadow-sm"
                    } ${
                      checked
                        ? "border-primary bg-primary/5 shadow-sm"
                        : blocked
                          ? "border-border opacity-40"
                          : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={readOnly || blocked}
                      onCheckedChange={() =>
                        !readOnly && !blocked && toggleLabel(opt.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Tag
                      className={`h-5 w-5 transition-colors shrink-0 ${
                        checked ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{opt.label}</span>
                      <p className="text-xs text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                    {opt.mutualExcl && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                        excl.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {hasLabelConflict && (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm animate-in fade-in duration-200 dark:border-amber-900 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-400">
                  <strong>Conflict:</strong> Transactional Note and Announcement
                  cannot be selected together. Please remove one.
                </p>
              </div>
            )}
          </>
        );
      }}
    />

    {errors.labels && <FieldError>{errors.labels.message}</FieldError>}
  </FieldContent>
</Field>
