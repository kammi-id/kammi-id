const Page = () => {
  return (
    <main className='bg-background flex min-h-dvh flex-col items-center justify-center px-4'>
      <div className='flex max-w-lg flex-col items-center gap-6 text-center'>
        <div className='text-8xl select-none'>🚧</div>

        <div className='flex flex-col gap-2'>
          <h1 className='font-heading text-foreground text-4xl font-bold tracking-tight'>
            Under Construction
          </h1>
          <p className='text-muted-foreground text-lg'>
            Halaman ini sedang dalam pengembangan.
            <br />
            Nantikan kehadirannya sebentar lagi!
          </p>
        </div>

        <div className='text-muted-foreground border-border flex items-center gap-2 rounded-full border px-4 py-2 text-sm'>
          <span className='bg-primary size-2 animate-pulse rounded-full' />
          Sedang dibangun&hellip;
        </div>
      </div>
    </main>
  )
}

export default Page
