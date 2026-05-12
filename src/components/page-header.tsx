import Image from 'next/image'

interface PageHeaderProps {
  title: string
  subtitle: string
  marginBottom?: string
}

export function PageHeader({ title, subtitle, marginBottom = 'mb-6' }: PageHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    
    <div className="flex items-center cursor-pointer">
      
    </div>
  </div>
  )
}
