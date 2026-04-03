import type { JSX, ReactNode } from 'react'
import { Heading1 as H1 } from '~/components/common/typography'

const TrainingLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <>
      <H1>Dauroh & Training</H1>
      {children}
    </>
  )
}

export default TrainingLayout
