'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Input } from '~/components/shadcn/ui/input'
import {
  ImageUploadIcon,
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
  variant?: 'avatar' | 'background'
}

const ImageUpload = ({
  value,
  onChange,
  label,
  folder = 'uploads',
  variant = 'avatar'
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const updatePreview = async () => {
      if (!value) {
        setPreview(null)
        return
      }
      if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('/')
      ) {
        setPreview(value)
        return
      }
      try {
        const signedUrl = await getSignedUrlAction(value)
        setPreview(signedUrl)
      } catch (error) {
        console.error('Failed to fetch signed URL for preview:', error)
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
      if (
        value &&
        !value.startsWith('http://') &&
        !value.startsWith('https://') &&
        !value.startsWith('/')
      ) {
        formData.append('existingPath', value)
      }

      const uploadedPath = await uploadImageAction(formData)

      // 3. Update parent state
      onChange(uploadedPath)

      // Clean up local object URL
      URL.revokeObjectURL(localPreview)
    } catch (error) {
      console.error('Upload failed:', error)
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  if (variant === 'background') {
    return (
      <div className='space-y-2'>
        {label && (
          <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
            {label}
          </label>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileChange}
          disabled={isUploading}
          className='hidden'
        />

        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'group relative w-full overflow-hidden rounded-lg border-2 border-dashed transition-all',
            'aspect-video',
            preview
              ? 'border-transparent'
              : 'border-muted-foreground/25 bg-muted hover:border-primary/50 hover:bg-muted/80'
          )}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt='Preview'
                className='h-full w-full object-cover'
              />
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/40'>
                <div className='flex flex-col items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
                  <HugeiconsIcon
                    icon={Upload01Icon}
                    className='h-6 w-6 text-white'
                  />
                  <span className='text-sm font-medium text-white'>
                    Ganti Gambar
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center justify-center gap-2 py-8'>
              <HugeiconsIcon
                icon={ImageUploadIcon}
                className='text-muted-foreground h-10 w-10'
              />
              <div className='text-center'>
                <p className='text-muted-foreground text-sm font-medium'>
                  Klik untuk upload
                </p>
                <p className='text-muted-foreground/70 mt-0.5 text-[11px]'>
                  JPG, PNG, WebP · Maks. 5MB
                </p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
              <HugeiconsIcon
                icon={Loading01Icon}
                className='h-8 w-8 animate-spin text-white'
              />
            </div>
          )}
        </button>
      </div>
    )
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
