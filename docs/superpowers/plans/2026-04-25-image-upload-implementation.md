# Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement instant image upload for organization logos (branches) and member photos with smart updates and orphan file cleanup.

**Architecture:** A reusable `ImageUpload` component triggers a centralized `uploadImageAction`. The action interacts with `storage.ts` to either create a new file or update an existing one in S3. The resulting path is stored in the form state and eventually saved to the database.

**Tech Stack:** Next.js 16, Drizzle ORM, S3/MinIO (via Bun.S3Client), Zod, React Hook Form.

---

### Task 1: Storage Server Actions

**Files:**
- Create: `src/lib/actions/storage.ts`

- [ ] **Step 1: Implement `uploadImageAction`**
```typescript
'use server'
import { storage } from '~/lib/api/storage'

export async function uploadImageAction(formData: FormData) {
  const file = formData.get('file') as File
  const existingPath = formData.get('existingPath') as string | null
  const folder = formData.get('folder') as string || 'uploads'

  if (!file) throw new Error('No file provided')

  if (existingPath) {
    return await storage.updateFile(existingPath, file)
  }
  return await storage.uploadFile(file, folder)
}
```

- [ ] **Step 2: Implement `deleteImageAction`**
```typescript
'use server'
import { storage } from '~/lib/api/storage'

export async function deleteImageAction(path: string) {
  if (!path) return { success: false }
  try {
    await storage.deleteFile(path)
    return { success: true }
  } catch (error) {
    console.error('Delete Error:', error)
    return { success: false }
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/actions/storage.ts
git commit -m "feat: add centralized storage server actions"
```

### Task 2: Reusable `ImageUpload` Component

**Files:**
- Create: `src/components/image-upload.tsx`

- [ ] **Step 1: Implement `ImageUpload` basic structure and file handling**
```tsx
'use client'
import React, { useState, useEffect } from 'react'
import { uploadImageAction } from '~/lib/actions/storage'
import { Input } from '~/components/shadcn/ui/input'
import { Loader2 } from 'lucide-react' // or Hugeicons

interface ImageUploadProps {
  value?: string
  onChange: (path: string) => void
  label?: string
  folder?: string
}

export const ImageUpload = ({ value, onChange, label, folder = 'uploads' }: ImageUploadProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    setPreview(URL.createObjectURL(file))
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('existingPath', value || '')
      formData.append('folder', folder)

      const path = await uploadImageAction(formData)
      onChange(path)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted">
          {preview ? (
            <img src={preview} alt="Preview" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Signed URL support for initial value**
Implement a way to fetch the signed URL for the `value` prop when the component mounts so the existing image is shown.

- [ ] **Step 3: Commit**
```bash
git add src/components/image-upload.tsx
git commit -m "feat: add reusable ImageUpload component"
```

### Task 3: Branches Form Integration

**Files:**
- Modify: `src/app/(dashboard)/dashboard/branches/_components/add-form/add-form.tsx`
- Modify: `src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts`

- [ ] **Step 1: Update Zod schema to include `logo` (optional string)**
- [ ] **Step 2: Integrate `ImageUpload` into the form UI**
- [ ] **Step 3: Update Server Action to save `logo` path to DB**
- [ ] **Step 4: Implement cleanup logic**
  - Add `useEffect` that calls `deleteImageAction` if the form is unmounted and a new path was uploaded but not yet saved.
- [ ] **Step 5: Commit**
```bash
git add src/app/(dashboard)/dashboard/branches/_components/add-form/
git commit -m "feat: add image upload to branches form"
```

### Task 4: Members Form Integration

**Files:**
- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/add-form.tsx`
- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Update Zod schema to include `photo` (optional string)**
- [ ] **Step 2: Integrate `ImageUpload` into the form UI**
- [ ] **Step 3: Update Server Action to save `photo` path to DB**
- [ ] **Step 4: Implement cleanup logic**
- [ ] **Step 5: Commit**
```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/
git commit -m "feat: add image upload to members form"
```

### Task 5: Final Verification

- [ ] **Step 1: Verify new member/branch upload works**
- [ ] **Step 2: Verify image update (overwriting) works**
- [ ] **Step 3: Verify orphan file cleanup on cancel**
- [ ] **Step 4: Final Commit**
