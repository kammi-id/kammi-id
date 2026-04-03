import type {
  JSX,
  ReactNode,
  ComponentPropsWithoutRef as ComponentProps
} from 'react'
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../shadcn/ui/alert-dialog'

/**
 * Props for the AlertDialog component based on Shadcn UI.
 */
export type AlertDialogProps = {
  /** Title for the alert dialog header. */
  title: ReactNode
  /** Descriptive text explaining the alert. */
  description?: ReactNode
  /** Custom content if needed. */
  children?: ReactNode
  /** Optional footer content (e.g. actions/buttons). */
  footer?: ReactNode
} & ComponentProps<typeof AlertDialogRoot>

/**
 * A reusable alert dialog component built on top of shadcn/ui.
 * It simplifies the API by exposing title, description, and footer props.
 */
const AlertDialog = ({
  title,
  description,
  children,
  footer,
  ...props
}: AlertDialogProps): JSX.Element => {
  return (
    <AlertDialogRoot {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        {footer && <AlertDialogFooter>{footer}</AlertDialogFooter>}
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}

export default AlertDialog
