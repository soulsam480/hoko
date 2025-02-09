import { connection } from '../connection'
import { Object } from './object'
import GisSatellite from '~icons/gis/satellite'
import CarbonCloseOutline from '~icons/carbon/close-outline'

export function CurrentTrackingControls() {
  return (
    <div className='flex flex-col gap-1'>
      <Object
        label='Currently tracking'
        title={connection.trackingState.value.feeder_id || ''}
        icon={GisSatellite}
        description={`since ${connection.trackingState.value.started_at?.toLocaleTimeString()}`}
      />

      <div className='ml-5 flex flex-col gap-1'>
        <button
          className='inline-flex gap-1 text-red-600 text-xs font-semibold max-w-max'
          onClick={() => connection.untrack()}
        >
          <CarbonCloseOutline /> <span>Untrack</span>
        </button>
      </div>
    </div>
  )
}
