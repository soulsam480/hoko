import CarbonPreviousOutline from '~icons/carbon/previous-outline'

interface IBackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: IBackButtonProps) {
  return (
    <button className='text-cyan-800' type='button' onClick={onClick}>
      <CarbonPreviousOutline />
    </button>
  )
}
