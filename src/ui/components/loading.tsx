export function Loading() {
  return (
    <div className='fixed inset-0 z-20 bg-base-300 flex flex-col justify-center items-center gap-2'>
      <span className='loading loading-spinner loading-lg text-primary'></span>
      <span className='text-xs text-neutral'>Please wait initializing...</span>
    </div>
  )
}
