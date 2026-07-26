import CarbonChevronLeft from '~icons/carbon/chevron-left'

interface IBackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: IBackButtonProps) {
  return (
    <button
      className='btn btn-circle btn-ghost btn-sm'
      type='button'
      onClick={onClick}
      aria-label='Back'
    >
      <CarbonChevronLeft className='w-4 h-4' />
    </button>
  )
}
