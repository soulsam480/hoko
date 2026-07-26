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
        {label && <div className='text-xs text-base-content/70'>{label}</div>}
        <div className='text-xs font-semibold text-base-content'>{title}</div>
        {description && (
          <div className='text-xs text-base-content/70 break-words'>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}
