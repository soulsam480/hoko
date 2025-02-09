import { connection } from '../connection'
import { Object } from './object'
import GisSearchPoi from '~icons/gis/search-poi'

export function AvailableFeeders() {
  return (
    <div className='flex flex-col gap-1'>
      <Object title='Showing available feeders' icon={GisSearchPoi} />

      {connection.feeders.value.length === 0 && (
        <div class='text-xs text-c'>
          No feeders available for the chosen route!
        </div>
      )}

      <ul class='flex flex-col max-h-[calc(100vh_/_3)] overflow-y-scroll empty:hidden'>
        {connection.feeders.value.map(feeder => {
          return (
            <li class='text-xs' key={feeder}>
              <button
                class='p-1 hover:bg-cyan-100 rounded-sm w-full text-start'
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
