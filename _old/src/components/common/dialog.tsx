import type {
  JSX,
  ReactNode,
  ComponentPropsWithoutRef as ComponentProps
} from 'react'
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../shadcn/ui/dialog'

/**
 * Props for the Dialog component based on Shadcn UI.
 */
export type DialogProps = {
  /** Optional title for the dialog header. */
  title?: ReactNode
  /** Optional descriptive text explaining the dialog. */
  description?: ReactNode
  /** The main content of the dialog. */
  children?: ReactNode
  /** Optional footer content (e.g. actions/buttons). */
  footer?: ReactNode
  /** Whether to show the close button. */
  showCloseButton?: ComponentProps<typeof DialogContent>['showCloseButton']
} & ComponentProps<typeof DialogRoot>

/**
 * A reusable dialog component built on top of shadcn/ui.
 * It simplifies the API by exposing trigger, title, description, and footer props.
 */
const Dialog = ({
  title,
  description,
  children,
  footer,
  showCloseButton,
  ...props
}: DialogProps): JSX.Element => {
  return (
    <DialogRoot {...props}>
      <DialogContent showCloseButton={showCloseButton}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  )
}

export default Dialog
