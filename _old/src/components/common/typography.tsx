import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import { cn } from '~/lib/shadcn/utils'

export function Heading1({
  className,
  ...props
}: ComponentProps<'h1'>): JSX.Element {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        className
      )}
      {...props}
    />
  )
}

export function Heading2({
  className,
  ...props
}: ComponentProps<'h2'>): JSX.Element {
  return (
    <h2
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    />
  )
}

export function Heading3({
  className,
  ...props
}: ComponentProps<'h3'>): JSX.Element {
  return (
    <h3
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight',
        className
      )}
      {...props}
    />
  )
}

export function Heading4({
  className,
  ...props
}: ComponentProps<'h4'>): JSX.Element {
  return (
    <h4
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight',
        className
      )}
      {...props}
    />
  )
}

export function Paragraph({
  className,
  ...props
}: ComponentProps<'p'>): JSX.Element {
  return (
    <p
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    />
  )
}

export function Blockquote({
  className,
  ...props
}: ComponentProps<'blockquote'>): JSX.Element {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    />
  )
}

export function Table({
  className,
  ...props
}: ComponentProps<'table'>): JSX.Element {
  return (
    <div className='my-6 w-full overflow-y-auto'>
      <table className={cn('w-full', className)} {...props} />
    </div>
  )
}

export function List({
  className,
  ...props
}: ComponentProps<'ul'>): JSX.Element {
  return (
    <ul
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    />
  )
}

export function InlineCode({
  className,
  ...props
}: ComponentProps<'code'>): JSX.Element {
  return (
    <code
      className={cn(
        'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className
      )}
      {...props}
    />
  )
}

export function Lead({
  className,
  ...props
}: ComponentProps<'p'>): JSX.Element {
  return (
    <p className={cn('text-muted-foreground text-xl', className)} {...props} />
  )
}

export function Large({
  className,
  ...props
}: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('text-lg font-semibold', className)} {...props} />
}

export function Small({
  className,
  ...props
}: ComponentProps<'small'>): JSX.Element {
  return (
    <small
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    />
  )
}

export function Muted({
  className,
  ...props
}: ComponentProps<'p'>): JSX.Element {
  return (
    <p className={cn('text-muted-foreground text-sm', className)} {...props} />
  )
}
