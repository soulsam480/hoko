import { chosenStop, closestStops } from '../stores'
import { Object } from './object'

export function StopList() {
  if (chosenStop.value) {
    return
  }

  return (
    <div className='flex flex-col gap-2'>
      <Object
        title='Choose boarding bus stop'
        description='Showing withing 1km radius'
      />

      <ul class='flex flex-col max-h-[calc(100vh_/_3)] overflow-y-scroll'>
        {closestStops.value.map(stop => {
          return (
            <li class='text-xs' key={stop.id}>
              <button
                class='p-1 hover:bg-cyan-100 rounded w-full text-start'
                type='button'
                onClick={() => {
                  chosenStop.value = stop
                }}
              >
                {stop.name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
