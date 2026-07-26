import CarbonChevronLeft from '~icons/carbon/chevron-left'
import GisLocation from '~icons/gis/location'
import { connection } from '../connection'
import { chosenRoute, chosenStop, insideBus } from '../stores'

export function SelectedRouteControls() {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2 mb-3'>
        <button
          className='btn btn-circle btn-ghost btn-sm'
          type='button'
          onClick={() => {
            connection.leaveRoute()
            insideBus.value = false
            chosenRoute.value = null
          }}
          aria-label='Back'
        >
          <CarbonChevronLeft className='w-4 h-4' />
        </button>
        <div>
          <div className='text-xs uppercase tracking-wide text-base-content/50'>
            Currently tracking
          </div>
          <h2 className='text-lg font-semibold leading-tight font-mono'>
            {chosenRoute.value?.name || ''}
          </h2>
        </div>
      </div>

      <div className='flex items-center gap-2 text-sm text-base-content/70 mb-4 pl-1'>
        <GisLocation className='w-4 h-4 shrink-0' />
        From{' '}
        <span className='font-medium text-base-content'>
          {chosenStop.value!.name}
        </span>
      </div>

      <div className='divider my-0 text-xs text-base-content/40'>Settings</div>

      <div className='flex items-start justify-between gap-4 py-3'>
        <div>
          <div className='font-medium'>Are you inside this bus?</div>
          <p className='text-sm text-base-content/60 mt-0.5'>
            Share your location to help others track this bus. Your identity is
            not shared.
          </p>
        </div>
        <input
          type='checkbox'
          className='toggle toggle-primary mt-1 shrink-0'
          checked={insideBus.value}
          onChange={() => {
            connection.toggleInsideBus(!insideBus.value)
          }}
        />
      </div>
    </div>
  )
}
