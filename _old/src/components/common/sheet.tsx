import type {
  JSX,
  ReactNode,
  ComponentPropsWithoutRef as ComponentProps
} from 'react'
import {
  Sheet as SheetRoot,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '../shadcn/ui/sheet'

/**
 * Props for the Sheet component based on Shadcn UI.
 */
export type SheetProps = {
  /** Optional title for the sheet header. */
  title?: ReactNode
  /** Optional descriptive text explaining the sheet. */
  description?: ReactNode
  /** The main content of the sheet. */
  children?: ReactNode
  /** Optional footer content (e.g. actions/buttons). */
  footer?: ReactNode
  /** The side the sheet slides in from. */
  side?: ComponentProps<typeof SheetContent>['side']
  /** Whether to show the close button. */
  showCloseButton?: ComponentProps<typeof SheetContent>['showCloseButton']
} & ComponentProps<typeof SheetRoot>

/**
 * A reusable sheet component built on top of shadcn/ui.
 * It simplifies the API by exposing title, description, side, and footer props.
 */
const Sheet = ({
  title,
  description,
  children,
  footer,
  side,
  showCloseButton,
  ...props
}: SheetProps): JSX.Element => {
  return (
    <SheetRoot {...props}>
      <SheetContent
        className='p-4'
        side={side}
        showCloseButton={showCloseButton}
      >
        {(title || description) && (
          <SheetHeader className='-mx-4 border-b pb-4'>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className='-mx-4 flex-1 overflow-y-auto px-4 py-2'>{children}</div>
        {footer && (
          <SheetFooter className='-mx-4 border-t px-4 pt-4'>
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </SheetRoot>
  )
}

export default Sheet
