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
      className='border-t border-border bg-muted/30 py-20 lg:py-28'
      aria-labelledby='alumni-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2
              id='alumni-heading'
              className='font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
            >
              Jejaring Alumni
            </h2>
            <div className='mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
            <p className='mt-3 max-w-xl font-sans text-sm leading-relaxed text-muted-foreground'>
              Ribuan alumni KAMMI kini berkarya di berbagai bidang: memberi dampak
              nyata dalam kehidupan berbangsa dan bernegara.
            </p>
          </div>
          <Link
            href='#bergabung'
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
          >
            Jadi Alumni KAMMI
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {ALUMNI.map((person) => (
            <article key={person.id} className='group overflow-hidden rounded-2xl border border-border bg-background'>
              <div className='relative overflow-hidden'>
                <Image
                  src={`https://picsum.photos/seed/${person.seed}/400/280`}
                  alt={`Foto ${person.name}`}
                  width={400}
                  height={280}
                  className='h-48 w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent' aria-hidden='true' />
              </div>
              <div className='p-5'>
                <h3 className='font-heading text-base font-bold text-foreground'>{person.name}</h3>
                <p className='mt-0.5 font-sans text-xs font-medium text-primary'>{person.title}</p>
                <p className='mt-3 font-sans text-sm leading-relaxed text-muted-foreground'>
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
