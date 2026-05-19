'use client'

import { toast } from '@cib/design-system-components'
import { useParams, useRouter } from 'next/navigation'

import {
  MessageTemplate,
  useGetMessageTemplateByIdQuery,
} from '../state/templatesSlice'
import { TemplateEditor } from './components/Templates/TemplateEditor'

export function TemplateDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = Number(params.id)

  const {
    data: templateData,
    isLoading,
    error,
    refetch,
  } = useGetMessageTemplateByIdQuery(id)

  const handleSaved = (_saved: MessageTemplate) => {
    toast.success('Template saved successfully.')
    router.push('/notifications/templates')
  }

  const handleCancel = () => {
    router.push('/notifications/templates')
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground text-sm">
        Loading template...
      </div>
    )
  }

  if (error || !templateData?.data) {
    return (
      <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center text-destructive text-sm">
        Error loading template. Please try again.
      </div>
    )
  }

  return (
    <TemplateEditor
      template={templateData.data}
      onSaved={handleSaved}
      onCancel={handleCancel}
      refetch={refetch}
    />
  )
}
---------------
