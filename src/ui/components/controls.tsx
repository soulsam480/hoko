import { useSignal } from '@preact/signals'
import CarbonCenterCircle from '~icons/carbon/center-circle'
import GisPoisO from '~icons/gis/pois-o'
import { recenterMap } from '../geo/map'
import { theme } from '../stores'
import { RouteList } from './routeList'
import { StopList } from './stopList'
import { TrackingControls } from './trackingControls'

export function Controls() {
  const open = useSignal(true)
  const isDark = useSignal(theme.value === 'dracula')

  const toggle = () => {
    isDark.value = !isDark.value
    theme.value = isDark.value ? 'dracula' : 'lemonade'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return (
    <>
      <div className='fixed top-4 right-4 z-20 flex flex-col gap-2'>
        <button
          className='btn btn-circle btn-sm btn-soft shadow-lg'
          type='button'
          onClick={() => {
            open.value = !open.value
          }}
        >
          <GisPoisO className='stroke-2' />
        </button>

        <button
          className='btn btn-circle btn-sm btn-soft'
          type='button'
          aria-label='Recenter map'
          onClick={recenterMap}
        >
          <CarbonCenterCircle className='w-5 h-5' />
        </button>
        <button
          className='btn btn-circle btn-sm btn-soft shadow-lg'
          type='button'
          onClick={toggle}
        >
          {isDark.value ? '🌙' : '☀️'}
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
