'use client'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@cib/design-system-components'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  GripVertical,
  Lock,
  MessageSquare,
  Plus,
  Send,
  Smartphone,
  Unlock,
  Upload,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useGetAudienceQuery } from '../../../state/audiences-api-slice'
import {
  useGetCampaignAudiencesQuery,
} from '../../../state/campaigns-api-slice'
import {
  useGetMessageTemplateByIdQuery,
  useGetMessageTemplatesQuery,
} from '../../../state/templatesSlice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../chadcn components/alert-dialogue'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../chadcn components/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../chadcn components/popover'
import { TemplatePreview } from '../Templates/TemplatePreview'

const CHANNEL_VALUES = ['SMS', 'PUSH'] as const

const campaignConfigSchema = z.object({
  templateId: z.string().min(1, { message: 'Template is required' }),
  audienceIds: z.array(z.number()).optional(),
  audienceMode: z.enum(['OPEN', 'CLOSED'], {
    message: 'Audience type is required',
  }),
  channels: z
    .array(z.enum(CHANNEL_VALUES))
    .min(1, { message: 'Select at least one channel' }),
  dispatchLogic: z.enum(['FIRST_MATCHED', 'ONLY_SELECTED'], {
    message: 'Dispatch logic is required',
  }),
  isPersist: z.boolean(),
})

export type CampaignConfigFormValues = z.infer<typeof campaignConfigSchema>

interface CampaignConfigureFormProps {
  campaignId?: string
  defaultValues?: Partial<CampaignConfigFormValues>
  onSaveDraft?: (values: CampaignConfigFormValues) => void
  onSubmitForApproval?: (values: CampaignConfigFormValues) => void
  isSubmitting?: boolean
  readOnly?: boolean
}

const CHANNEL_OPTIONS = [
  {
    value: 'SMS' as const,
    label: 'SMS',
    icon: MessageSquare,
    desc: 'Short message service',
  },
  {
    value: 'PUSH' as const,
    label: 'Push Notification',
    icon: Smartphone,
    desc: 'Mobile push alerts',
  },
]

const DISPATCH_OPTIONS = [
  ['FIRST_MATCHED', 'First Available'],
  ['ONLY_SELECTED', 'All Selected'],
] as const

export function CampaignConfigureForm({
  campaignId,
  defaultValues,
  onSaveDraft,
  onSubmitForApproval,
  isSubmitting,
  readOnly,
}: CampaignConfigureFormProps) {
  const { data: templates } = useGetMessageTemplatesQuery({ size: 1000 })
  const { data: audiencesData } = useGetCampaignAudiencesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignConfigFormValues>({
    resolver: zodResolver(
      campaignConfigSchema,
    ) as Resolver<CampaignConfigFormValues>,
    defaultValues: {
      templateId: '',
      audienceIds: [],
      audienceMode: 'OPEN',
      channels: ['SMS'],
      dispatchLogic: 'FIRST_MATCHED',
      isPersist: false,
      ...defaultValues,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTemplateId = watch('templateId')

  const selectedAudienceMode = watch('audienceMode')

  const selectedAudienceIds = watch('audienceIds')
  const selectedAudienceId = selectedAudienceIds?.[0]
  const { data: selectedTemplate } = useGetMessageTemplateByIdQuery(
    Number(selectedTemplateId),
    { skip: !selectedTemplateId },
  )
  const { data: selectedAudience } = useGetAudienceQuery(
    Number(selectedAudienceId),
    { skip: !selectedAudienceId },
  )
  const audienceFromList = audiencesData?.data?.find(
    a => a.id === selectedAudienceId,
  )
  const recipientCount =
    selectedAudience?.memberCount ?? audienceFromList?.memberCount
  const tpl = selectedTemplate?.data

  // Audience type ('QUERY' vs 'UPLOAD') drives whether the inputter is
  // allowed to pick OPEN/CLOSED. Upload-list audiences have their members
  // materialised in `audiences_members` and are therefore always CLOSED.
  const selectedAudienceKind: 'QUERY' | 'UPLOAD' | undefined =
    selectedAudience?.type ?? audienceFromList?.type
  const isUploadAudience = selectedAudienceKind === 'UPLOAD'

  // Keep `audienceMode` in sync with the selected audience's kind so an
  // upload-list audience can never be submitted as OPEN. The effect only
  // forces CLOSED; when the audience is a query, whatever the inputter
  // previously chose is preserved.
  useEffect(() => {
    if (isUploadAudience && selectedAudienceMode !== 'CLOSED') {
      setValue('audienceMode', 'CLOSED', { shouldValidate: true })
    }
  }, [isUploadAudience, selectedAudienceMode, setValue])

  const channels = watch('channels')
  const allSelected = channels?.length === CHANNEL_OPTIONS.length

  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [audienceSearch, setAudienceSearch] = useState('')

  const filteredTemplates = (templates?.data ?? []).filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()),
  )
  const filteredAudiences = (audiencesData?.data ?? []).filter(a =>
    a.name.toLowerCase().includes(audienceSearch.toLowerCase()),
  )

  const [showOpenConfirm, setShowOpenConfirm] = useState(false)
  const pendingSubmitRef = useRef<CampaignConfigFormValues | null>(null)

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [orderedChannels, setOrderedChannels] = useState(CHANNEL_OPTIONS)
  const dragOverIdx = useRef<number | null>(null)
  const dragStartIdx = useRef<number | null>(null)

  const handleSelectAll = (checked: boolean) => {
    setValue('channels', checked ? CHANNEL_OPTIONS.map(o => o.value) : [], {
      shouldValidate: true,
    })
  }

  const onDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragStartIdx.current = idx
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverIdx.current = idx
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const from = dragStartIdx.current
    const to = dragOverIdx.current
    if (from === null || to === null || from === to) {
      setDragIdx(null)
      dragStartIdx.current = null
      dragOverIdx.current = null
      return
    }
    setOrderedChannels(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    })
    setDragIdx(null)
    dragStartIdx.current = null
    dragOverIdx.current = null
  }, [])

  const onDragEnd = useCallback(() => {
    setDragIdx(null)
    dragStartIdx.current = null
    dragOverIdx.current = null
  }, [])

  // Reorder channels by the current drag-ordered list before submitting
  const reorderChannels = useCallback(
    (values: CampaignConfigFormValues): CampaignConfigFormValues => {
      const order = orderedChannels.map(o => o.value)
      const sorted = [...(values.channels ?? [])].sort(
        (a, b) => order.indexOf(a) - order.indexOf(b),
      )
      return { ...values, channels: sorted }
    },
    [orderedChannels],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Templates & Audiences */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel className="flex items-center gap-2">
                Notification Template
                {!readOnly && (
                  <Link
                    href="/notifications/templates/new"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Template
                  </Link>
                )}
              </FieldLabel>
              <FieldContent>
                <Controller
                  name="templateId"
                  control={control}
                  render={({ field }) => (
                    <Popover
                      open={templateOpen}
                      onOpenChange={open => {
                        if (!readOnly) {
                          setTemplateOpen(open)
                          if (!open) setTemplateSearch('')
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={readOnly}
                          className="w-full flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className={
                              field.value ? '' : 'text-muted-foreground'
                            }
                          >
                            {field.value
                              ? (templates?.data?.find(
                                  t => String(t.id) === field.value,
                                )?.name ?? 'Select a template')
                              : 'Select a template'}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 min-w-[300px] w-[var(--radix-popover-trigger-width)]"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search templates..."
                            value={templateSearch}
                            onValueChange={setTemplateSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No templates found.</CommandEmpty>
                            <CommandGroup>
                              {filteredTemplates.map(t => (
                                <CommandItem
                                  key={t.id}
                                  value={t.name}
                                  onSelect={() => {
                                    field.onChange(String(t.id))
                                    setTemplateOpen(false)
                                    setTemplateSearch('')
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${String(t.id) === field.value ? 'opacity-100' : 'opacity-0'}`}
                                  />
                                  {t.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.templateId && (
                  <FieldError>{errors.templateId.message}</FieldError>
                )}

                {tpl && (
                  <div className="mt-3 animate-in fade-in duration-200">
                    <TemplatePreview template={tpl} />
                  </div>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Notification Audience
                {audiencesData?.data && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {audiencesData.data.length} available
                    {recipientCount != null && (
                      <> · {recipientCount} recipients</>
                    )}
                  </span>
                )}
                {!readOnly && (
                  <Link
                    href="/notifications/audiences/new"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Audience
                  </Link>
                )}
              </FieldLabel>
              <FieldContent>
                <Controller
                  name="audienceIds"
                  control={control}
                  render={({ field }) => (
                    <Popover
                      open={audienceOpen}
                      onOpenChange={open => {
                        if (!readOnly) {
                          setAudienceOpen(open)
                          if (!open) setAudienceSearch('')
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={readOnly}
                          className="w-full flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className={
                              field.value?.[0] != null
                                ? ''
                                : 'text-muted-foreground'
                            }
                          >
                            {field.value?.[0] != null
                              ? (audiencesData?.data?.find(
                                  a => a.id === field.value![0],
                                )?.name ?? 'Select an audience')
                              : 'Select an audience'}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 min-w-[300px] w-[var(--radix-popover-trigger-width)]"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search audiences..."
                            value={audienceSearch}
                            onValueChange={setAudienceSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No audiences found.</CommandEmpty>
                            <CommandGroup>
                              {filteredAudiences.map(a => (
                                <CommandItem
                                  key={a.id}
                                  value={a.name}
                                  onSelect={() => {
                                    field.onChange([a.id])
                                    setAudienceOpen(false)
                                    setAudienceSearch('')
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${field.value?.[0] === a.id ? 'opacity-100' : 'opacity-0'}`}
                                  />
                                  {a.name}
                                  {a.memberCount != null && (
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {a.memberCount} members
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />

                {selectedAudience && (
                  <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                    <div className="rounded-lg border bg-card">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-semibold text-sm">
                            {selectedAudience.name}
                          </span>
                        </div>
                        {recipientCount != null && (
                          <span className="text-xs text-muted-foreground">
                            {recipientCount} recipients
                            {isUploadAudience
                              ? ' (from uploaded list)'
                              : selectedAudienceMode === 'CLOSED'
                                ? ' (snapshot at submission)'
                                : ' (resolved at approval)'}
                          </span>
                        )}
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        {selectedAudience.description && (
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Description
                            </label>
                            <p className="text-sm text-foreground">
                              {selectedAudience.description}
                            </p>
                          </div>
                        )}
                        {selectedAudience.platforms?.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Platforms
                            </label>
                            <p className="text-sm text-foreground">
                              {selectedAudience.platforms.join(', ')}
                            </p>
                          </div>
                        )}
                        {selectedAudience.language && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Language
                            </label>
                            <p className="text-sm text-foreground">
                              {selectedAudience.language}
                            </p>
                          </div>
                        )}
                        {selectedAudience.userAssociations?.length ? (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              User Association
                            </label>
                            <p className="text-sm text-foreground">
                              {selectedAudience.userAssociations.join(', ')}
                            </p>
                          </div>
                        ) : null}
                        {selectedAudience.appVersion && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              App Version
                            </label>
                            <p className="text-sm text-foreground">
                              {selectedAudience.appVersion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Audience Type</FieldLabel>
              <FieldDescription>
                {isUploadAudience
                  ? 'This audience uses an uploaded list, so its recipients are already fixed in the database. The campaign is always Closed.'
                  : 'Choose how the audience list is resolved when the campaign is dispatched.'}
              </FieldDescription>
              <FieldContent>
                <Controller
                  name="audienceMode"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: 'CLOSED' as const,
                          label: 'Closed',
                          icon: Lock,
                          desc: 'Recipients are fixed when you submit — no changes after that',
                        },
                        {
                          value: 'OPEN' as const,
                          label: 'Open',
                          icon: Unlock,
                          desc: 'Recipients are determined when the campaign is approved',
                        },
                      ].map(opt => {
                        const active = field.value === opt.value
                        // Upload-list audiences force CLOSED. Disable the
                        // OPEN choice in that case to prevent the bug where
                        // the inputter would pick OPEN but the backend
                        // still served the pre-uploaded snapshot.
                        const disabled =
                          readOnly || (isUploadAudience && opt.value === 'OPEN')
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => field.onChange(opt.value)}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 text-left ${
                              disabled
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer hover:shadow-sm'
                            } ${
                              active
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <opt.icon
                              className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
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
                        )
                      })}
                    </div>
                  )}
                />

                {errors.audienceMode && (
                  <FieldError>{errors.audienceMode.message}</FieldError>
                )}

                {isUploadAudience && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm animate-in fade-in duration-200 dark:border-amber-900 dark:bg-amber-950/30">
                    <Upload className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-300">
                        Uploaded list — campaign is locked to Closed
                      </p>
                      <p className="text-amber-800 dark:text-amber-400/90 mt-1">
                        Members of this audience were uploaded and stored in the{' '}
                        <code>audiences_members</code> table. When the campaign
                        runs, recipients are retrieved directly from that
                        snapshot, so Open is not applicable.
                      </p>
                    </div>
                  </div>
                )}

                {!isUploadAudience && selectedAudienceMode === 'CLOSED' && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm animate-in fade-in duration-200 dark:border-blue-900 dark:bg-blue-950/30">
                    <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-400">
                        Closed audience — recipients are locked at submission
                      </p>
                      <p className="text-blue-700 dark:text-blue-500 mt-1">
                        The recipient list is captured the moment you submit the
                        campaign. Even if people join or leave the audience
                        later, the campaign will only be sent to the{' '}
                        <strong>original list</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {!isUploadAudience && selectedAudienceMode === 'OPEN' && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm animate-in fade-in duration-200 dark:border-amber-900 dark:bg-amber-950/30">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-400">
                        Open audience — recipients are not finalized yet
                      </p>
                      <p className="text-amber-700 dark:text-amber-500 mt-1">
                        The recipient list will be determined when the
                        authorizer approves the campaign. Any people who join or
                        leave the audience before approval <strong>will</strong>{' '}
                        be included or excluded accordingly.
                      </p>
                    </div>
                  </div>
                )}
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

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
                      onCheckedChange={checked => handleSelectAll(!!checked)}
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
                        const checked = field.value?.includes(opt.value)
                        return (
                          <div
                            key={opt.value}
                            draggable={!readOnly}
                            onDragStart={
                              readOnly ? undefined : e => onDragStart(e, idx)
                            }
                            onDragOver={
                              readOnly ? undefined : e => onDragOver(e, idx)
                            }
                            onDrop={readOnly ? undefined : onDrop}
                            onDragEnd={readOnly ? undefined : onDragEnd}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${
                              readOnly
                                ? 'cursor-default'
                                : 'cursor-grab active:cursor-grabbing hover:shadow-sm'
                            } ${dragIdx === idx ? 'opacity-40 scale-95' : ''} ${
                              checked
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            {!readOnly && (
                              <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                            )}
                            <Checkbox
                              checked={checked}
                              disabled={readOnly}
                              onCheckedChange={isChecked => {
                                const next = isChecked
                                  ? [...(field.value || []), opt.value]
                                  : field.value?.filter(v => v !== opt.value) ||
                                    []
                                field.onChange(next)
                              }}
                            />
                            <opt.icon
                              className={`h-5 w-5 transition-colors ${checked ? 'text-primary' : 'text-muted-foreground'}`}
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
                        )
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
                        const active = field.value === v
                        return (
                          <button
                            key={v}
                            type="button"
                            disabled={readOnly}
                            onClick={() => field.onChange(v)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              readOnly ? 'cursor-default' : 'cursor-pointer'
                            } ${
                              active
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/30 text-muted-foreground'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full transition-colors ${
                                active ? 'bg-primary' : 'bg-muted-foreground/30'
                              }`}
                            />
                            {l}
                          </button>
                        )
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
                          label: 'Enabled',
                          desc: 'Saved in mobile app inbox',
                        },
                        {
                          value: false,
                          label: 'Disabled',
                          desc: 'Not persisted after delivery',
                        },
                      ].map(opt => {
                        const active = field.value === opt.value
                        return (
                          <button
                            key={String(opt.value)}
                            type="button"
                            disabled={readOnly}
                            onClick={() => field.onChange(opt.value)}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 text-left ${
                              readOnly
                                ? 'cursor-default'
                                : 'cursor-pointer hover:shadow-sm'
                            } ${
                              active
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <Smartphone
                              className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
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
                        )
                      })}
                    </div>
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <>
          <div className="flex justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={handleSubmit(v => onSaveDraft!(reorderChannels(v)))}
              className="transition-all hover:shadow-sm"
            >
              Save Draft
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSubmit(values => {
                const ordered = reorderChannels(values)
                if (ordered.audienceMode === 'OPEN') {
                  pendingSubmitRef.current = ordered
                  setShowOpenConfirm(true)
                } else {
                  onSubmitForApproval!(ordered)
                }
              })}
              className="transition-all hover:shadow-md"
            >
              Submit for Approval
            </Button>
          </div>

          <AlertDialog
            open={showOpenConfirm}
            onOpenChange={open => {
              if (!open) pendingSubmitRef.current = null
              setShowOpenConfirm(open)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit with Open Audience?</AlertDialogTitle>
                <AlertDialogDescription>
                  This campaign uses an open audience. Audience members will{' '}
                  <strong>not</strong> be fetched from the database now. The
                  list will be retrieved when the authorizer approves the
                  campaign, so any members added or removed before approval will
                  be reflected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingSubmitRef.current) {
                      onSubmitForApproval!(pendingSubmitRef.current)
                      pendingSubmitRef.current = null
                    }
                  }}
                >
                  Confirm & Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
