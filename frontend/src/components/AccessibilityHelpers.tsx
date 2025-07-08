import React from 'react'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ 
  children, 
  politeness = 'polite', 
  atomic = true 
}) => {
  return (
    <div 
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

interface FormErrorProps {
  id: string
  children: React.ReactNode
  show: boolean
}

export const FormError: React.FC<FormErrorProps> = ({ id, children, show }) => {
  if (!show) return null
  
  return (
    <p 
      id={id} 
      className="mt-1 text-sm text-red-400" 
      role="alert"
      aria-live="polite"
    >
      {children}
    </p>
  )
}

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a 
      href={href} 
      className="skip-link"
    >
      {children}
    </a>
  )
}

interface FocusTrapProps {
  children: React.ReactNode
  active: boolean
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active }) => {
  const trapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !trapRef.current) return

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // You can add escape handler logic here
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscapeKey)
    
    // Focus first element when trap becomes active
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [active])

  return (
    <div ref={trapRef}>
      {children}
    </div>
  )
}

interface LoadingAnnouncementProps {
  isLoading: boolean
  loadingMessage?: string
  completedMessage?: string
}

export const LoadingAnnouncement: React.FC<LoadingAnnouncementProps> = ({ 
  isLoading, 
  loadingMessage = 'Loading...', 
  completedMessage = 'Loading complete' 
}) => {
  const [announced, setAnnounced] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading && !announced) {
      setAnnounced(true)
      const timer = setTimeout(() => setAnnounced(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, announced])

  return (
    <LiveRegion politeness="polite">
      {isLoading ? loadingMessage : announced ? completedMessage : ''}
    </LiveRegion>
  )
}

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}

export const Heading: React.FC<HeadingProps> = ({ level, children, className = '', id }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  )
}

export default {
  ScreenReaderOnly,
  LiveRegion,
  FormError,
  SkipLink,
  FocusTrap,
  LoadingAnnouncement,
  Heading
} 