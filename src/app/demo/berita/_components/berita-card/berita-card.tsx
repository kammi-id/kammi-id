import Image from 'next/image'
import type { DemoNewsArticle } from '../../_data/news'

type BeritaCardProps = {
  article: DemoNewsArticle
}

export const BeritaCard = ({ article }: BeritaCardProps) => (
  <article className='overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md'>
    <Image
      src={article.image}
      alt=''
      width={640}
      height={400}
      className='aspect-[1.6] w-full object-cover'
    />
    <div className='space-y-2.5 p-5'>
      <p className='text-primary text-xs font-semibold uppercase tracking-[0.12em]'>
        {article.category}
      </p>
      <p className='text-sm text-slate-500'>{article.date}</p>
      <h2 className='font-heading text-lg font-bold leading-snug text-slate-950'>
        {article.title}
      </h2>
    </div>
  </article>
)
