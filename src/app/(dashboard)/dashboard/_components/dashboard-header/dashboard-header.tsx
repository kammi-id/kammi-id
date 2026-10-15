const roleLabels: Record<string, string> = {
  root: 'Administrator',
  bph: 'Badan Pengurus Harian',
  bpk: 'Bidang Pembinaan Kader',
  bpw: 'Badan Pengembangan Wilayah',
  humas: 'Hubungan Masyarakat'
}

const getGreeting = (hour: number) => {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return "Assalamu'alaikum"
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export const DashboardHeader = ({
  displayName,
  role,
  orgName,
  date
}: {
  displayName: string | null
  role: string
  orgName: string
  date: Date
}) => {
  const hour = date.getHours()
  const greeting = getGreeting(hour)
  const name = displayName?.split(' ')[0] ?? 'Kak'

  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className='flex flex-col gap-0.5'>
      <p className='text-muted-foreground text-xs'>{formattedDate}</p>
      <h1 className='font-heading text-2xl font-bold tracking-tight'>
        {greeting}, {name}.
      </h1>
      <p className='text-muted-foreground text-sm'>
        {orgName}{' '}
        <span className='text-muted-foreground/60'>
          &middot; {roleLabels[role] ?? role}
        </span>
      </p>
    </div>
  )
}
