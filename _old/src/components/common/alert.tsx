import type {
  JSX,
  ReactNode,
  ComponentPropsWithoutRef as ComponentProps
} from 'react'
import {
  Alert as AlertRoot,
  AlertTitle,
  AlertDescription,
  AlertAction
} from '../shadcn/ui/alert'

/**
 * Props for the Alert component.
 */
type AlertProps = {
  /** Optional title for the alert. */
  title?: string
  /** Optional descriptive text explaining the alert. */
  description?: string
  /** Optional icon element for visual context. */
  icon?: ReactNode
  /** Optional action element (e.g. a button). */
  action?: ReactNode
} & ComponentProps<typeof AlertRoot>

/**
 * A reusable alert component that displays an icon, title, description,
 * action, and optional custom content. Built on top of shadcn/ui components.
 */
const Alert = ({
  title,
  description,
  icon,
  action,
  children,
  ...props
}: AlertProps): JSX.Element => {
  return (
    <AlertRoot {...props}>
      {icon}
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
      {children}
      {action && <AlertAction>{action}</AlertAction>}
    </AlertRoot>
  )
}

export default Alert
