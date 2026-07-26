import { useSignal } from '@preact/signals'
import GisPoisO from '~icons/gis/pois-o'
import { RouteList } from './routeList'
import { StopList } from './stopList'
import { TrackingControls } from './trackingControls'

export function Controls() {
  const open = useSignal(true)
  return (
    <>
      <div className='fixed top-4 left-4 z-20'>
        <button
          className='btn btn-circle btn-sm btn-soft shadow-lg'
          type='button'
          onClick={() => {
            open.value = !open.value
          }}
        >
          <GisPoisO className='stroke-2' />
        </button>
      </div>

      <div
        className='fixed inset-x-0 bottom-0 z-30 px-3 pb-3 transition-all duration-300 ease-out'
        style={{
          transform: open.value ? 'translateY(0)' : 'translateY(100%)',
          opacity: open.value ? 1 : 0,
          pointerEvents: open.value ? 'auto' : 'none'
        }}
      >
        <div className='card bg-base-100/95 backdrop-blur border border-base-300 shadow-2xl'>
          <div className='flex justify-center pt-2'>
            <div className='w-10 h-1.5 rounded-full bg-base-300'></div>
          </div>
          <div className='card-body pt-3'>
            <StopList />
            <RouteList />
            <TrackingControls />
          </div>
        </div>
      </div>
    </>
  )
}
