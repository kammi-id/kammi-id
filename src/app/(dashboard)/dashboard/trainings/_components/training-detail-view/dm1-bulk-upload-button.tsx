'use client'

import { BulkUploadDialog } from '~/app/(dashboard)/dashboard/kader/_components/bulk-upload'

interface DM1BulkUploadButtonProps {
  trainingId: string
  organizationId: string
}

export const DM1BulkUploadButton = ({
  trainingId,
  organizationId
}: DM1BulkUploadButtonProps) => {
  return (
    <BulkUploadDialog
      organizationId={organizationId}
      trainingId={trainingId}
    />
  )
}
