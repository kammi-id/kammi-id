import { Notification03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const NotificationsPage = () => {
  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={Notification03Icon}
            strokeWidth={2}
            className='size-7'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Notifikasi
          </h1>
          <p className='text-muted-foreground leading-relaxed'>
            Kelola pemberitahuan dan preferensi notifikasi Anda.
          </p>
        </div>
      </div>

      <div className='bg-card rounded-3xl border p-6 shadow-xs md:p-8 lg:p-10'>
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='bg-muted rounded-full p-4'>
              <HugeiconsIcon
                icon={Notification03Icon}
                strokeWidth={2}
                className='text-muted-foreground size-10'
              />
            </div>
          </div>
          <h2 className='font-heading text-lg font-bold'>
            Belum ada notifikasi
          </h2>
          <p className='text-muted-foreground max-w-xs text-sm'>
            Notifikasi Anda akan muncul di sini ketika ada update terbaru
            mengenai organisasi.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
