import CarbonPreviousOutline from '~icons/carbon/previous-outline'

interface IBackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: IBackButtonProps) {
  return (
    <button
      className='hover:text-cyan-600 transition-colors duration-200 ease-in-out'
      type='button'
      onClick={onClick}
    >
      <CarbonPreviousOutline />
    </button>
  )
}
