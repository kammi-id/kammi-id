'use client'

import type { JSX } from 'react'
import dynamic from 'next/dynamic'
import type { Organization } from '~/app/(dashboard)/dashboard/_data/organization'
import type { WithError } from '~/lib/helper/with-error'

const TrainingSheet = dynamic(() => import('../form/sheet'))
const TrainingForm = dynamic(() => import('../form/form'))
import type { OrganizationLevel } from '../form/form'

type TrainingOverlaysProps = {
  organizerId: string
  organizerLevel: OrganizationLevel
  organizerOptionsPromise: WithError<Organization[]>
}

const TrainingOverlays = ({
  organizerId,
  organizerLevel,
  organizerOptionsPromise
}: TrainingOverlaysProps): JSX.Element => {
  return (
    <>
      <TrainingSheet>
        <TrainingForm
          organizerId={organizerId}
          organizerLevel={organizerLevel}
          organizerOptionsPromise={organizerOptionsPromise}
        />
      </TrainingSheet>
    </>
  )
}

export default TrainingOverlays
