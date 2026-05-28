'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageUploadIcon, Loading01Icon } from '@hugeicons/core-free-icons'
import { uploadImageAction, getSignedUrlAction } from '~/lib/actions/storage'
import { cn } from '~/lib/shadcn/utils'

const CHECKER_STYLE: React.CSSProperties = {
  backgroundColor: 'oklch(0.98 0.001 285.823)',
  backgroundImage: `
    linear-gradient(45deg, oklch(0.92 0.004 286.32) 25%, transparent 25%),
    linear-gradient(-45deg, oklch(0.92 0.004 286.32) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, oklch(0.92 0.004 286.32) 75%),
    linear-gradient(-45deg, transparent 75%, oklch(0.92 0.004 286.32) 75%)
  `,
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
}

interface TransparentImageUploadProps {
  value?: string
  onChange: (path: string) => void
  folder?: string
  height?: number
  className?: string
}

export const TransparentImageUpload = ({
  value,
  onChange,
  folder = 'uploads',
  height = 192,
  className
}: TransparentImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!value) {
        setPreview(null)
        return
      }
      if (value.startsWith('http') || value.startsWith('/')) {
        setPreview(value)
        return
      }
      try {
        const url = await getSignedUrlAction(value)
        setPreview(url)
      } catch {
        setPreview(null)
      }
    }
    load()
  }, [value])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'image/png') {
      toast.error('Hanya file PNG yang diizinkan.')
      e.target.value = ''
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setIsUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      if (value && !value.startsWith('http') && !value.startsWith('/')) {
        fd.append('existingPath', value)
      }
      const path = await uploadImageAction(fd)
      onChange(path)
      URL.revokeObjectURL(localPreview)
    } catch {
      toast.error('Gagal mengunggah foto.')
      setPreview(null)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <label
        className='group relative block cursor-pointer'
        style={{ height, ...CHECKER_STYLE }}
        aria-label='Area upload foto PNG transparan'
      >
        {isUploading ? (
          <div className='absolute inset-0 flex items-center justify-center'>
            <HugeiconsIcon
              icon={Loading01Icon}
              className='text-primary size-6 animate-spin'
            />
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt='Preview foto'
            className='absolute inset-0 h-full w-full object-contain p-2'
          />
        ) : (
          <div className='text-muted-foreground/50 group-hover:text-muted-foreground/70 absolute inset-0 flex flex-col items-center justify-center gap-2 transition-colors'>
            <HugeiconsIcon
              icon={ImageUploadIcon}
              className='size-8'
              strokeWidth={1.5}
            />
            <span className='font-mono text-[10px] tracking-wider uppercase'>
              Unggah PNG transparan
            </span>
          </div>
        )}
        {preview && !isUploading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100'>
            <div className='flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm'>
              <HugeiconsIcon
                icon={ImageUploadIcon}
                className='text-foreground size-3.5'
                strokeWidth={2}
              />
              <span className='text-foreground text-[11px] font-medium'>
                Ganti foto
              </span>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type='file'
          accept='image/png'
          className='sr-only'
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  )
}
