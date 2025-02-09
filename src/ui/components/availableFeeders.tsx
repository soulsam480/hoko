import { connection } from '../connection'
import { Object } from './object'

export function AvailableFeeders() {
  return (
    <div className='flex flex-col gap-1'>
      <Object title='Showing available feeders' />

      {connection.feeders.value.length === 0 && (
        <div class='text-xs text-c'>
          No feeders available for the chosen route!
        </div>
      )}

      <ul class='grid grid-cols-2 gap-x-1 max-h-[calc(100vh_/_3)] overflow-y-scroll empty:hidden'>
        {connection.feeders.value.map(feeder => {
          return (
            <li class='text-xs' key={feeder}>
              <button
                class='p-1 hover:bg-cyan-100 rounded w-full text-start'
                type='button'
                onClick={() => {
                  connection.track(feeder.id)
                }}
              >
                {feeder.id}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
