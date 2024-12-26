export function Loading() {
  return (
    <div class='fixed inset-0 z-20 bg-cyan-100 bg-opacity-70 flex flex-col justify-center items-center'>
      <span class='animate-bounce block'>
        <img src='/icon-48-48.png' height={32} width={32} />
      </span>
      <span class='text-xs'>Please wait initializing...</span>
    </div>
  )
}
