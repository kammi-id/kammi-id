import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '~/components/shadcn/ui/card'

const page = {
  title: 'Selamat Datang di KAMMI.id.',
  description: 'Silahkan login untuk mengakses dashboard Anda.'
} as const

const LoginCard = ({
  children,
  ...props
}: ComponentProps<typeof Card>): JSX.Element => {
  return (
    <Card {...props}>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl'>{page.title}</CardTitle>
        <CardDescription>{page.description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default LoginCard
