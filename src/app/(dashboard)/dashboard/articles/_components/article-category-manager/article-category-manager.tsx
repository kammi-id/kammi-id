'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  Loading03Icon,
  FolderLibraryIcon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError
} from '~/components/shadcn/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/shadcn/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction
} from './action'

export type CategoryRow = {
  id: string
  organizationId: string
  name: string
  slug: string
  parentId: string | null
}

interface ArticleCategoryManagerProps {
  organizationId: string
  categories: CategoryRow[]
}

// Sentinel for the "no parent" option — Select cannot use an empty string as a
// value, and we convert this back to `undefined` before calling the action
// (the schema requires parentId to be a uuid when present).
const NO_PARENT = '__none__'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

type TreeNode = CategoryRow & { children: TreeNode[]; depth: number }

const buildTree = (categories: CategoryRow[]): TreeNode[] => {
  const byParent = new Map<string | null, CategoryRow[]>()
  for (const category of categories) {
    const key = category.parentId
    const siblings = byParent.get(key) ?? []
    siblings.push(category)
    byParent.set(key, siblings)
  }

  const build = (parentId: string | null, depth: number): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        ...category,
        depth,
        children: build(category.id, depth + 1)
      }))

  return build(null, 0)
}

const flattenTree = (nodes: TreeNode[]): TreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children)])

// Descendant ids of a category — used to exclude invalid parent options when
// editing (a category cannot be parented to itself or its own descendants).
const collectDescendantIds = (
  categoryId: string,
  categories: CategoryRow[]
): Set<string> => {
  const childrenOf = new Map<string | null, CategoryRow[]>()
  for (const category of categories) {
    const siblings = childrenOf.get(category.parentId) ?? []
    siblings.push(category)
    childrenOf.set(category.parentId, siblings)
  }
  const result = new Set<string>()
  const walk = (id: string) => {
    for (const child of childrenOf.get(id) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id)
        walk(child.id)
      }
    }
  }
  walk(categoryId)
  return result
}

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; category: CategoryRow }
  | null

export const ArticleCategoryManager = ({
  organizationId,
  categories
}: ArticleCategoryManagerProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [parentValue, setParentValue] = useState<string>(NO_PARENT)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const tree = useMemo(() => flattenTree(buildTree(categories)), [categories])

  const fieldErrors = (field: string) =>
    errors[field]?.map((message) => ({ message }))

  const openCreate = () => {
    setName('')
    setSlug('')
    setSlugTouched(false)
    setParentValue(NO_PARENT)
    setErrors({})
    setDialogState({ mode: 'create' })
  }

  const openEdit = (category: CategoryRow) => {
    setName(category.name)
    setSlug(category.slug)
    setSlugTouched(true)
    setParentValue(category.parentId ?? NO_PARENT)
    setErrors({})
    setDialogState({ mode: 'edit', category })
  }

  const closeDialog = () => setDialogState(null)

  // When editing, exclude the category itself and its descendants from the
  // parent options so the UI cannot suggest an obvious cycle.
  const parentOptions = useMemo(() => {
    if (dialogState?.mode === 'edit') {
      const excluded = collectDescendantIds(dialogState.category.id, categories)
      excluded.add(dialogState.category.id)
      return categories.filter((category) => !excluded.has(category.id))
    }
    return categories
  }, [dialogState, categories])

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!dialogState) return
    setErrors({})

    const payload = {
      organizationId,
      name,
      slug,
      parentId: parentValue === NO_PARENT ? undefined : parentValue
    }

    startTransition(async () => {
      const result =
        dialogState.mode === 'edit'
          ? await updateCategoryAction(dialogState.category.id, payload)
          : await createCategoryAction(payload)

      if (result.success) {
        toast.success(result.message)
        closeDialog()
        router.refresh()
      } else {
        if (result.errors) setErrors(result.errors)
        toast.error(result.message)
      }
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteCategoryAction(deleteTarget.id)
      if (result.success) {
        toast.success(result.message)
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <Button type='button' onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} className='size-4' />
          Tambah Kategori
        </Button>
      </div>

      {tree.length === 0 ? (
        <div className='text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm'>
          Belum ada kategori. Tambahkan kategori pertama antum.
        </div>
      ) : (
        <ul className='divide-y rounded-2xl border'>
          {tree.map((node) => (
            <li
              key={node.id}
              className='flex items-center justify-between gap-4 p-3'
            >
              <div
                className='flex min-w-0 items-center gap-2'
                style={{ paddingLeft: `${node.depth * 1.5}rem` }}
              >
                <HugeiconsIcon
                  icon={FolderLibraryIcon}
                  className='text-muted-foreground size-4 shrink-0'
                />
                <span className='truncate font-medium'>{node.name}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  /{node.slug}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Ubah kategori ${node.name}`}
                  onClick={() => openEdit(node)}
                  disabled={isPending}
                >
                  <HugeiconsIcon icon={Edit02Icon} className='size-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Hapus kategori ${node.name}`}
                  onClick={() => setDeleteTarget(node)}
                  disabled={isPending}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className='text-destructive size-4'
                  />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === 'edit'
                ? 'Ubah Kategori'
                : 'Tambah Kategori'}
            </DialogTitle>
            <DialogDescription>
              Atur nama, permalink, dan kategori induk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={Boolean(fieldErrors('name')) || undefined}>
                <FieldLabel htmlFor='category-name'>Nama</FieldLabel>
                <Input
                  id='category-name'
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  aria-invalid={Boolean(fieldErrors('name')) || undefined}
                />
                <FieldError errors={fieldErrors('name')} />
              </Field>

              <Field data-invalid={Boolean(fieldErrors('slug')) || undefined}>
                <FieldLabel htmlFor='category-slug'>Permalink</FieldLabel>
                <Input
                  id='category-slug'
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value)
                  }}
                  aria-invalid={Boolean(fieldErrors('slug')) || undefined}
                />
                <FieldError errors={fieldErrors('slug')} />
              </Field>

              <Field
                data-invalid={Boolean(fieldErrors('parentId')) || undefined}
              >
                <FieldLabel htmlFor='category-parent'>
                  Kategori Induk
                </FieldLabel>
                <Select
                  value={parentValue}
                  onValueChange={(val) => setParentValue(val ?? NO_PARENT)}
                >
                  <SelectTrigger id='category-parent'>
                    <SelectValue placeholder='Pilih induk' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PARENT}>Tanpa Induk</SelectItem>
                    {parentOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={fieldErrors('parentId')} />
              </Field>
            </FieldGroup>

            <DialogFooter className='mt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={closeDialog}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className='size-4 animate-spin'
                  />
                )}
                {dialogState?.mode === 'edit'
                  ? 'Simpan Perubahan'
                  : 'Buat Kategori'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus kategori {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus kategori ini. Sub-kategori di bawahnya
              akan menjadi kategori induk (tanpa induk). Kategori yang masih
              dipakai oleh artikel tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={handleDelete}
              disabled={isPending}
            >
              Ya, Hapus Kategori
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
