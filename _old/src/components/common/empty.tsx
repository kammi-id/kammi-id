import type {
  JSX,
  ReactNode,
  ComponentPropsWithoutRef as ComponentProps
} from 'react'
import {
  Empty as EmptyRoot,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '../shadcn/ui/empty'

/**
 * Props for the Empty state component.
 */
type EmptyProps = {
  /** Optional title for the empty state. */
  title?: string
  /** Optional descriptive text explaining the empty state. */
  description?: string
  /** Optional media element (icon, image, etc.) for visual context. */
  media?: ReactNode
} & ComponentProps<typeof EmptyRoot>

/**
 * A reusable empty state component that displays a header (with title, description, and media)
 * and optional custom content. Built on top of shadcn/ui components.
 */
const Empty = ({
  title,
  description,
  media,
  children,
  ...props
}: EmptyProps): JSX.Element => {
  return (
    <EmptyRoot {...props}>
      <EmptyHeader>
        {media && <EmptyMedia variant='icon'>{media}</EmptyMedia>}
        {title && <EmptyTitle>{title}</EmptyTitle>}
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>{children}</EmptyContent>
    </EmptyRoot>
  )
}

export default Empty
