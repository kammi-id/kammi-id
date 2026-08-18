import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'

/**
 * The two badges the grid and the table both render.
 *
 * They live in one folder because spec §8.3 asks for one visual language across
 * both surfaces, and two copies of a colour map are two surfaces that drift.
 */
const JENJANG_LABELS: Record<string, string> = {
  pw: 'Wilayah',
  pd: 'Daerah',
  pdln: 'Daerah LN',
  pk: 'Komisariat',
  pp: 'Pusat'
}

const JENJANG_COLORS: Record<string, string> = {
  pw: 'border-primary text-primary bg-primary/5',
  pd: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
  pdln: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
  pk: '[border-color:var(--org-pk-border)] [color:var(--org-pk-text)] [background:var(--org-pk-bg)]',
  pp: '[border-color:var(--org-pp-border)] [color:var(--org-pp-text)] [background:var(--org-pp-bg)]'
}

export const jenjangLabel = (type: string): string =>
  JENJANG_LABELS[type] ?? type.toUpperCase()

export const StrukturJenjangBadge = ({
  type,
  className
}: {
  type: string
  className?: string
}) => (
  <Badge
    variant='outline'
    className={cn(
      'text-[10px] font-bold tracking-wider uppercase',
      JENJANG_COLORS[type] ?? 'border-slate-200 bg-slate-100 text-slate-700',
      className
    )}
  >
    {jenjangLabel(type)}
  </Badge>
)

/**
 * The Non-Aktif marker — **a label that reads, not a shade** (spec §8.3).
 *
 * It carries `text-foreground` rather than a muted tone on a muted ground: the
 * card around it is already toned down, and a marker that also faded would make
 * opacity the only thing distinguishing the two Keadaan, which is exactly what
 * the contrast requirement in PRODUCT.md refuses.
 *
 * There is no Terhapus counterpart on purpose. Struktur Terhapus never appear
 * on these surfaces at all (spec §7), and the one surface that shows them shows
 * nothing else — so Keadaan is that page's subject and needs no badge either.
 */
export const StrukturNonAktifBadge = ({
  className
}: {
  className?: string
}) => (
  <Badge
    variant='outline'
    className={cn(
      'border-border bg-muted text-foreground text-[10px] font-bold tracking-wider uppercase',
      className
    )}
  >
    Non-Aktif
  </Badge>
)
