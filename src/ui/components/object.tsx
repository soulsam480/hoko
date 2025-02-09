import { ComponentType } from 'preact'

interface IObjectProps {
  title: string
  description?: string
  icon?: ComponentType
}

export function Object({ title, description, icon: Icon }: IObjectProps) {
  return (
    <div className='flex items-start gap-1'>
      {Icon && <Icon />}

      <div className='flex flex-col'>
        <div class='text-xs font-semibold'>{title}</div>
        {description && <div class='text-gray-800 text-xxs'>{description}</div>}
      </div>
    </div>
  )
}
