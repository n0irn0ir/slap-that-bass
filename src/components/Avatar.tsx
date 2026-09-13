import { motion } from 'motion/react'
import { useRef } from 'react'
import { useT } from '../lib/i18n'
import { useAuth } from '../state/AuthContext'

/** Squash any image into a small square data URL so it fits in user metadata. */
async function toDataUrl(file: File, size = 96): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.72)
}

export function Avatar({ size = 30 }: { size?: number }) {
  const { avatar, setAvatar } = useAuth()
  const { t } = useT()
  const input = useRef<HTMLInputElement>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    try {
      await setAvatar(await toDataUrl(file))
    } catch {
      /* unreadable file: ignore */
    }
  }

  return (
    <>
      <motion.button
        type="button"
        className={`avatar${avatar ? '' : ' blank'}`}
        style={{ width: size, height: size }}
        title={avatar ? t('avatar.change') : t('avatar.add')}
        aria-label={avatar ? t('avatar.change') : t('avatar.add')}
        onClick={() => input.current?.click()}
        whileHover={{ scale: 1.12, rotate: -6 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      >
        {avatar ? (
          <motion.img
            key={avatar.slice(-24)}
            src={avatar}
            alt=""
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          />
        ) : (
          <span aria-hidden>+</span>
        )}
      </motion.button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </>
  )
}
