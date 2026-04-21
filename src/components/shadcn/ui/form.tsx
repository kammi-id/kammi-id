"use client"

import * as React from "react"
import {
  Control,
  Controller,
  FieldValues,
  FieldPath,
  ControllerRenderProps,
  ControllerFieldState
} from "react-hook-form"
import { cn } from "~/lib/shadcn/utils"
import { Label } from "./label"

const Form = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("space-y-8", className)}
    {...props}
  >
    {children}
  </div>
)
Form.displayName = "Form"

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.HTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex", className)}
    {...props}
  />
))
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm font-medium text-destructive",
      className
    )}
    {...props}
  />
))
FormMessage.displayName = "FormMessage"

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  render,
}: {
  control: Control<TFieldValues>
  name: TName
  render: (
    field: ControllerRenderProps<TFieldValues, TName>,
    state: ControllerFieldState
  ) => React.ReactElement
}) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => render(field, fieldState)}
    />
  )
}

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
}
