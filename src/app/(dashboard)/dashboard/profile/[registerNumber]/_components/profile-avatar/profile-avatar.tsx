'use client'

import React, { useRef, useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { cn } from '~/lib/shadcn/utils'
import { uploadImageAction, getSignedUrlAction } from '~/lib/actions/storage'
import { updateMemberPhotoAction } from '../action'
import { HugeiconsIcon } from '@hugeicons/react'
import { Camera01Icon } from '@hugeicons/core-free-icons'

interface ProfileAvatarProps {
  name: string
  photoPath: string | null
  memberId: string
  canEdit: boolean
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const ProfileAvatar = ({
  name,
  photoPath,
  memberId,
  canEdit
}: ProfileAvatarProps) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!photoPath) {
      setPreview(null)
      return
    }
    if (
      photoPath.startsWith('http://') ||
      photoPath.startsWith('https://') ||
      photoPath.startsWith('/')
    ) {
      setPreview(photoPath)
      return
    }
    getSignedUrlAction(photoPath)
      .then(setPreview)
      .catch(() => setPreview(null))
  }, [photoPath])

  const handleClick = () => {
    if (canEdit) inputRef.current?.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previousPreview = preview
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    startUpload(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'kader')
        if (
          photoPath &&
          !photoPath.startsWith('http') &&
          !photoPath.startsWith('/')
        ) {
          formData.append('existingPath', photoPath)
        }
        const uploadedPath = await uploadImageAction(formData)
        await updateMemberPhotoAction(memberId, uploadedPath)
        URL.revokeObjectURL(localUrl)
      } catch {
        setPreview(previousPreview)
        URL.revokeObjectURL(localUrl)
        toast.error('Gagal mengupload foto. Silakan coba lagi.')
      }
    })
  }

  const initials = getInitials(name)

  return (
    <div className='relative shrink-0'>
      <button
        type='button'
        onClick={handleClick}
        disabled={!canEdit || isUploading}
        aria-label={canEdit ? 'Ganti foto profil' : undefined}
        className={cn(
          'relative flex size-20 items-center justify-center overflow-hidden rounded-full',
          'bg-border text-muted-foreground',
          'ring-border ring-2 ring-offset-2',
          canEdit &&
            'hover:ring-primary focus-visible:ring-primary cursor-pointer transition-all focus-visible:outline-none',
          !canEdit && 'cursor-default',
          'md:size-24'
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt={`Foto ${name}`}
            className='h-full w-full object-cover'
          />
        ) : (
          <span className='font-heading text-xl font-bold select-none md:text-2xl'>
            {initials}
          </span>
        )}

        {isUploading && (
          <div className='bg-foreground/40 absolute inset-0 flex items-center justify-center'>
            <span className='border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent' />
          </div>
        )}

        {canEdit && !isUploading && (
          <div className='bg-foreground/0 hover:bg-foreground/25 absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity hover:opacity-100'>
            <HugeiconsIcon
              icon={Camera01Icon}
              strokeWidth={1.5}
              className='size-6 text-white'
            />
          </div>
        )}
      </button>

      {canEdit && (
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          className='sr-only'
          onChange={handleFile}
          aria-hidden='true'
        />
      )}
    </div>
  )
}
