import { ComponentType } from 'preact'

interface IObjectProps {
  label?: string
  title: string
  description?: string
  icon?: ComponentType
}

export function Object({
  title,
  description,
  icon: Icon,
  label
}: IObjectProps) {
  return (
    <div className='flex items-center gap-1'>
      {Icon && <Icon />}

      <div className='flex flex-col'>
        {label && <div className='text-xxs'>{label}</div>}
        <div className='text-xs font-semibold'>{title}</div>
        {description && (
          <div className='text-gray-800 text-xxs break-words'>{description}</div>
        )}
      </div>
    </div>
  )
}
