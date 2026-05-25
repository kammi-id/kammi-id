import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'

const ALUMNI = [
  {
    id: 'ahmad-hifani',
    name: 'Dr. Ahmad Hifani',
    title: 'Anggota DPR-RI, Komisi VIII',
    excerpt:
      'KAMMI membentuk fondasi berpikir sistemik yang kini saya terapkan dalam setiap kebijakan publik yang saya perjuangkan.',
    seed: 'alumni-1'
  },
  {
    id: 'siti-mariam',
    name: 'Siti Maryam, M.S.A',
    title: 'Direktur Yayasan Beasiswa Nusantara',
    excerpt:
      'Dari lingkar KAMMI, saya belajar bahwa kepemimpinan sejati adalah tentang membangun, bukan hanya memerintah.',
    seed: 'alumni-2'
  },
  {
    id: 'faizal-akbar',
    name: 'Dr. Faizal Akbar',
    title: 'Peneliti Senior LIPI',
    excerpt:
      'Tradisi intelektual di KAMMI mengajarkan saya untuk bertanya lebih dalam sebelum menerima jawaban yang mudah.',
    seed: 'alumni-3'
  }
]

export const AlumniSection = () => {
  return (
    <section
      id='keanggotaan'
      className='border-border bg-muted/30 border-t py-20 lg:py-28'
      aria-labelledby='alumni-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2
              id='alumni-heading'
              className='font-heading text-foreground text-[clamp(1.5rem,3vw,2rem)] font-bold'
            >
              Jejaring Alumni
            </h2>
            <div
              className='bg-primary mt-1 h-1 w-12 rounded-full'
              aria-hidden='true'
            />
            <p className='text-muted-foreground mt-3 max-w-xl font-sans text-sm leading-relaxed'>
              Ribuan alumni KAMMI kini berkarya di berbagai bidang: memberi
              dampak nyata dalam kehidupan berbangsa dan bernegara.
            </p>
          </div>
          <Link
            href='#bergabung'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'shrink-0'
            )}
          >
            Jadi Alumni KAMMI
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {ALUMNI.map((person) => (
            <article
              key={person.id}
              className='group border-border bg-background overflow-hidden rounded-2xl border'
            >
              <div className='relative overflow-hidden'>
                <Image
                  src={`https://picsum.photos/seed/${person.seed}/400/280`}
                  alt={`Foto ${person.name}`}
                  width={400}
                  height={280}
                  className='h-48 w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0'
                />
                <div
                  className='from-foreground/30 absolute inset-0 bg-gradient-to-t to-transparent'
                  aria-hidden='true'
                />
              </div>
              <div className='p-5'>
                <h3 className='font-heading text-foreground text-base font-bold'>
                  {person.name}
                </h3>
                <p className='text-primary mt-0.5 font-sans text-xs font-medium'>
                  {person.title}
                </p>
                <p className='text-muted-foreground mt-3 font-sans text-sm leading-relaxed'>
                  &ldquo;{person.excerpt}&rdquo;
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
