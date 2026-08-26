import Image from 'next/image'

/**
 * The lean Situs Struktur template (spec "Template Situs", ticket 04) — every
 * Jenjang except PP. Three things only: Struktur identity, pengurus, Berita
 * (the last one is its own `BeritaPreviewSection`, shared with the full
 * template and rendered by the page alongside this component).
 *
 * A plain Server Component on purpose — no GSAP, no client boundary. The
 * full template's animated entrance is `HomeScene`'s signature, not a
 * baseline every template must clear; this one is meant to read as calmer.
 */

type ResolvedPortrait = {
  name: string
  photoSrc: string | null
}

type ResolvedLeaderMember = {
  id: string
  name: string
  role: string
  photoSrc: string | null
}

type ResolvedLeaderBlock = {
  id: string
  title: string
  members: ResolvedLeaderMember[]
}

type LeanHomeSceneProps = {
  identity: {
    name: string
    jenjangLabel: string
    logoSrc: string | null
  }
  leadership: {
    triumvirate: {
      ketua: ResolvedPortrait
      sekretaris: ResolvedPortrait
      bendahara: ResolvedPortrait
    }
    leaderBlocks: ResolvedLeaderBlock[]
  }
}

const Portrait = ({
  name,
  role,
  photoSrc
}: {
  name: string
  role: string
  photoSrc: string | null
}) => (
  <div className='flex flex-col items-center text-center'>
    <div className='bg-muted/40 relative aspect-square w-full max-w-[220px] overflow-hidden rounded-3xl'>
      {photoSrc ? (
        <Image
          src={photoSrc}
          alt={`Foto ${name}`}
          fill
          sizes='220px'
          className='object-cover'
          unoptimized={photoSrc.startsWith('http')}
        />
      ) : null}
    </div>
    <p className='text-primary mt-4 font-sans text-[10px] font-bold tracking-[0.2em] uppercase'>
      {role}
    </p>
    <p className='font-heading text-foreground mt-1 text-base font-bold'>
      {name}
    </p>
  </div>
)

export const LeanHomeScene = ({
  identity,
  leadership
}: LeanHomeSceneProps) => {
  const { ketua, sekretaris, bendahara } = leadership.triumvirate
  const triumvirate = [
    { key: 'ketua', label: 'Ketua', ...ketua },
    { key: 'sekretaris', label: 'Sekretaris', ...sekretaris },
    { key: 'bendahara', label: 'Bendahara', ...bendahara }
  ].filter((p) => p.name.trim().length > 0)

  const leaderBlocks = leadership.leaderBlocks.filter(
    (block) => block.members.length > 0
  )

  const hasPengurus = triumvirate.length > 0 || leaderBlocks.length > 0

  return (
    <div className='relative w-full'>
      {/*
       * ══════════════════════════════════════════════════════════════════
       * Identitas Struktur
       * ══════════════════════════════════════════════════════════════════
       */}
      <div
        className='bg-background relative w-full pt-32 pb-16 text-center md:pt-40 md:pb-20'
        aria-labelledby='identitas-heading'
      >
        <div className='mx-auto flex w-full max-w-3xl flex-col items-center px-6 lg:px-8'>
          {identity.logoSrc && (
            <div className='bg-muted/30 relative mb-6 size-20 overflow-hidden rounded-3xl md:size-24'>
              <Image
                src={identity.logoSrc}
                alt={`Logo ${identity.name}`}
                fill
                sizes='96px'
                className='object-contain'
                unoptimized={identity.logoSrc.startsWith('http')}
              />
            </div>
          )}
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            {identity.jenjangLabel}
          </p>
          <h1
            id='identitas-heading'
            className='font-heading text-foreground mt-2 text-[clamp(2rem,5vw,3.25rem)] leading-[1.1] font-bold tracking-tight'
          >
            {identity.name}
          </h1>
        </div>
      </div>

      {/*
       * ══════════════════════════════════════════════════════════════════
       * Pengurus
       * ══════════════════════════════════════════════════════════════════
       */}
      <div
        className='bg-background border-border relative w-full border-t py-16 md:py-24'
        aria-labelledby='pengurus-heading'
      >
        <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
          <div className='text-center'>
            <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
              Susunan Kepengurusan
            </p>
            <h2
              id='pengurus-heading'
              className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
            >
              Pengurus {identity.name}
            </h2>
          </div>

          {hasPengurus ? (
            <div className='mt-12 space-y-14'>
              {triumvirate.length > 0 && (
                <div className='mx-auto grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-3'>
                  {triumvirate.map((p) => (
                    <Portrait
                      key={p.key}
                      name={p.name}
                      role={p.label}
                      photoSrc={p.photoSrc}
                    />
                  ))}
                </div>
              )}

              {leaderBlocks.map((block) => (
                <div key={block.id}>
                  <h3 className='font-heading text-foreground text-center text-lg font-bold'>
                    {block.title}
                  </h3>
                  <div className='mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4'>
                    {block.members.map((m) => (
                      <Portrait
                        key={m.id}
                        name={m.name}
                        role={m.role}
                        photoSrc={m.photoSrc}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground mt-10 text-center font-sans text-sm'>
              Data pengurus belum tersedia.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
