import Image from 'next/image'

export function Logo() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 h-6 w-6 flex items-center justify-center rounded-md">
      <Image 
        src="/images/logo.svg" 
        alt="Logo" 
        width={12} 
        height={12} 
        className="w-3 h-3 text-primary-foreground" 
      />
    </div>
  )
}