const Loading = () => {
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <div className='border-primary size-8 animate-spin rounded-full border-4 border-t-transparent' />
        <p className='text-muted-foreground text-sm'>Loading dashboard...</p>
      </div>
    </div>
  )
}

export default Loading
