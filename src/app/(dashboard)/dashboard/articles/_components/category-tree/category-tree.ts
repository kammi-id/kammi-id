// Own component folder (AGENTS.md: a `_`-prefixed `_components/`-root file
// is types/constants only — this exports algorithms, so it graduated here)
// shared by `article-category-manager` (full tree management) and
// `category-combobox` (indented picker in the article form) so hierarchy
// display never drifts between the two.

export type CategoryTreeInput = {
  id: string
  name: string
  parentId: string | null
}

export type CategoryTreeNode<T extends CategoryTreeInput> = T & {
  children: CategoryTreeNode<T>[]
  depth: number
}

export const buildCategoryTree = <T extends CategoryTreeInput>(
  categories: T[]
): CategoryTreeNode<T>[] => {
  const byParent = new Map<string | null, T[]>()
  for (const category of categories) {
    const key = category.parentId
    const siblings = byParent.get(key) ?? []
    siblings.push(category)
    byParent.set(key, siblings)
  }

  const build = (
    parentId: string | null,
    depth: number
  ): CategoryTreeNode<T>[] =>
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

export const flattenCategoryTree = <T extends CategoryTreeInput>(
  nodes: CategoryTreeNode<T>[]
): CategoryTreeNode<T>[] =>
  nodes.flatMap((node) => [node, ...flattenCategoryTree(node.children)])
