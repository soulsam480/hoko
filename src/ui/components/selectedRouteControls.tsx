import { connection } from '../connection'
import { chosenRoute, chosenStop, insideBus } from '../stores'
import { BackButton } from './backButton'
import { Object } from './object'
import CarbonSettings from '~icons/carbon/settings'

export function SelectedRouteControls() {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <BackButton
          onClick={() => {
            insideBus.value = false
            chosenRoute.value = null

            connection.untrack()
            connection.resetFeeders()
          }}
        />
        <Object
          label='Currently tracking'
          title={chosenRoute.value || ''}
          description={`From: ${chosenStop.value!.name}`}
        />
      </div>

      <div className='flex flex-col gap-1'>
        <Object title='Settings' icon={CarbonSettings} />
        <label class='flex items-center gap-2 text-xs' id='inside-bus'>
          <input
            type='checkbox'
            checked={insideBus.value}
            onChange={() => {
              connection.updateInsideBus(!insideBus.value)
              insideBus.value = !insideBus.value
            }}
          />

          <Object
            title='Are you inside this bus ?'
            description='You can send your location info to help other users track this bus. Your identity is not shared.'
          />
        </label>
      </div>
    </div>
  )
}
