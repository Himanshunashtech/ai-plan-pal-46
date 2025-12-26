// src/components/PWAInstallButton.tsx
import React from 'react'
import { Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

interface PWAInstallButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  size = 'md'
}) => {
  const { canInstall, isInstalled, installPWA } = usePWAInstall()

  // Do not render if install is not possible or already installed
  if (!canInstall || isInstalled) return null

  const sizeClasses: Record<typeof size, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes: Record<typeof size, number> = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <button
      type="button"
      onClick={installPWA}
      aria-label="Install app"
      title="Install app"
      className={`
        fixed top-4 right-4 z-50
        ${sizeClasses[size]}
        ${className}
        bg-white
        rounded-full
        border border-gray-200
        shadow-lg
        hover:bg-gray-50
        hover:shadow-xl
        active:scale-95
        transition-all duration-200
        flex items-center justify-center
      `}
    >
      <Download
        size={iconSizes[size]}
        className="text-gray-700"
      />
    </button>
  )
}

export default PWAInstallButton

