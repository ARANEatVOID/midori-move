import { motion } from 'framer-motion'
import { Camera, UploadCloud } from 'lucide-react'

function ProfilePictureUpload({ preview, error, onChange }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <label htmlFor="profile-upload" className="cursor-pointer">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className={`group relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-dashed ${
            error ? 'border-red-400' : ''
          }`}
          style={{
            borderColor: error ? '#ef4444' : 'color-mix(in srgb, var(--color-accent-secondary) 75%, transparent)',
            background: 'radial-gradient(circle, rgba(87,255,140,0.12), rgba(255,255,255,0.02))',
            boxShadow: '0 0 30px rgba(87, 255, 140, 0.15)',
          }}
        >
          {preview ? (
            <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: 'rgba(87, 255, 140, 0.14)', color: 'var(--color-accent-primary)' }}
              >
                <Camera size={20} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Upload your photo</p>
                <p className="text-xs transition duration-300 group-hover:opacity-100" style={{ color: 'var(--color-text-secondary)' }}>
                  Click to upload
                </p>
              </div>
            </div>
          )}
          <motion.span
            className="absolute inset-0"
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: 'inset 0 0 40px rgba(87, 255, 140, 0.22)' }}
          />
        </motion.div>
      </label>
      <label className="button-secondary cursor-pointer" htmlFor="profile-upload">
        <UploadCloud size={16} />
        Choose File
      </label>
      <input
        id="profile-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
      {error ? (
        <p className="text-center text-sm text-red-500">{error}</p>
      ) : (
        <p className="text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          JPEG, PNG, or WEBP up to 5MB
        </p>
      )}
    </div>
  )
}

export default ProfilePictureUpload
