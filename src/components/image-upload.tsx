'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '~/components/shadcn/ui/input'
import {
  Loading01Icon,
  Upload01Icon,
  UserIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { uploadImageAction, getSignedUrlAction } from '~/lib/actions/storage'
import { cn } from '~/lib/shadcn/utils'

interface ImageUploadProps {
  value?: string
  onChange: (path: string) => void
  label?: string
  folder?: string
}

const ImageUpload = ({
  value,
  onChange,
  label,
  folder = 'uploads'
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const updatePreview = async () => {
      if (value) {
        try {
          const signedUrl = await getSignedUrlAction(value)
          setPreview(signedUrl)
        } catch (error) {
          console.error('Failed to fetch signed URL for preview:', error)
          setPreview(null)
        }
      } else {
        setPreview(null)
      }
    }

    updatePreview()
  }, [value])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Local Preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setIsUploading(true)

    try {
      // 2. Instant Upload via Server Action
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      if (value) {
        formData.append('existingPath', value)
      }

      const uploadedPath = await uploadImageAction(formData)

      // 3. Update parent state
      onChange(uploadedPath)

      // Clean up local object URL
      URL.revokeObjectURL(localPreview)
    } catch (error) {
      console.error('Upload failed:', error)
      setPreview(null) // Reset if upload fails, or keep local preview but show error
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className='space-y-2'>
      {label && (
        <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
          {label}
        </label>
      )}

      <div className='flex items-center gap-4'>
        <div className='group relative'>
          <div
            className={cn(
              'border-muted-foreground/25 bg-muted relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-all',
              'group-hover:border-primary/50'
            )}
          >
            {preview ? (
              <img
                src={preview || ''}
                alt='Preview'
                className='h-full w-full object-cover'
              />
            ) : (
              <HugeiconsIcon
                icon={UserIcon}
                className='text-muted-foreground h-10 w-10'
              />
            )}

            {isUploading && (
              <div className='bg-background/60 absolute inset-0 flex items-center justify-center'>
                <HugeiconsIcon
                  icon={Loading01Icon}
                  className='text-primary h-6 w-6 animate-spin'
                />
              </div>
            )}
          </div>
        </div>

        <div className='flex-1'>
          <div className='relative'>
            <Input
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              disabled={isUploading}
              className='cursor-pointer'
            />
            <div className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2'>
              <HugeiconsIcon
                icon={Upload01Icon}
                className='text-muted-foreground h-4 w-4'
              />
            </div>
          </div>
          <p className='text-muted-foreground mt-1 text-[11px]'>
            Max size: 5MB. Supported: JPG, PNG, WebP.
          </p>
        </div>
      </div>
    </div>
  )
}

export { ImageUpload }
