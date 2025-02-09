import { useSignal } from '@preact/signals'
import GisPoisO from '~icons/gis/pois-o'
import { StopList } from './stopList'
import { RouteList } from './routeList'
import { TrackingControls } from './trackingControls'

export function Controls() {
  const openControls = useSignal(true)
  return (
    <>
      <button
        class='bg-cyan-50 p-2 border border-cyan-200 relative text-cyan-800 rounded-full shadow-md'
        type='button'
        onClick={() => {
          openControls.value = !openControls.value
        }}
      >
        <GisPoisO class='stroke-2' />
      </button>

      {openControls.value && (
        <div className='max-w-[100vw_-_32px] rounded-lg flex flex-col gap-2 p-2 bg-cyan-50 border-cyan-200 border shadow-md'>
          <StopList />
          <RouteList />
          <TrackingControls />
        </div>
      )}
    </>
  )
}
