import CarbonCenterCircle from '~icons/carbon/center-circle'
import { Controls } from './ui/components/controls'
import { Loading } from './ui/components/loading'
import { isInitializingDatabase } from './ui/stores'
import { recenterMap } from './ui/geo/map'

export function App() {
  return (
    <>
      {isInitializingDatabase.value && <Loading />}

      <button
        className='btn btn-circle btn-neutral shadow-lg fixed top-4 right-4 z-20'
        type='button'
        aria-label='Recenter map'
        onClick={recenterMap}
      >
        <CarbonCenterCircle className='w-5 h-5' />
      </button>

      <Controls />
    </>
  )
}
