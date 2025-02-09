import { useSignal } from '@preact/signals'
import { getSearchedRoutes } from '../../db/browser/queries'
import { connection } from '../connection'
import { chosenRoute, chosenStop } from '../stores'
import { suspendFn } from '../suspense-utils'
import { BackButton } from './backButton'

import { Suspense } from 'preact/compat'

interface ISearchedProps {
  term: string
}

interface IListProps {
  routes: string[]
}

function List({ routes }: IListProps) {
  return (
    <ul class='grid grid-cols-2 gap-x-1 max-h-[calc(100vh_/_3)] overflow-y-scroll'>
      {routes.map((route, id) => {
        return (
          <li class='text-xs' key={`${route}__${id}`}>
            <button
              class='p-1 hover:bg-cyan-100 rounded w-full text-start'
              type='button'
              onClick={() => {
                chosenRoute.value = route

                if (chosenStop.value === null) {
                  return
                }

                connection.findFeeders(chosenStop.value?.id, route)
              }}
            >
              {route}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function SearchedList({ term }: ISearchedProps) {
  const fetcher = () => getSearchedRoutes(chosenStop.value!.id, term)

  const data = suspendFn(`routes-${chosenStop.value!.id}-${term}`, fetcher)()

  return <List routes={data} />
}

export function RouteList() {
  const term = useSignal('')

  if (!chosenStop.value || chosenRoute.value) {
    return
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='text-xs mb-1 flex gap-2 justify-between'>
        <BackButton
          onClick={() => {
            chosenStop.value = null
            chosenRoute.value = null
          }}
        />

        <div>
          Select a route from{' '}
          <span className='font-semibold'>{chosenStop.value.name}</span> to
          track
        </div>
      </div>

      <input
        type='text'
        placeholder='Search routes'
        onInput={e => (term.value = e.currentTarget.value)}
      />

      {term.value.length > 0 && (
        <Suspense fallback={<div>Loading...</div>}>
          <SearchedList term={term.value} />
        </Suspense>
      )}

      {term.value.length === 0 && (
        <List routes={chosenStop.value?.route_list} />
      )}
    </div>
  )
}
