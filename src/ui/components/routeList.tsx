import { useSignal } from '@preact/signals'
import { getSearchedRoutes } from '../../db/browser/queries'
import { connection } from '../connection'
import { chosenRoute, chosenStop } from '../stores'
import { suspendFn } from '../suspense-utils'
import { BackButton } from './backButton'

import { Suspense } from 'preact/compat'
import { Object } from './object'

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
              class='p-1 hover:bg-cyan-100 rounded-sm w-full text-start'
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
      <div className='flex gap-2'>
        <BackButton
          onClick={() => {
            chosenStop.value = null
            chosenRoute.value = null

            connection.resetFeeders()
          }}
        />

        <Object
          title={chosenStop.value!.name}
          description='Choose a route to track'
        />
      </div>

      <input
        type='text'
        placeholder='Search routes'
        onInput={e => (term.value = e.currentTarget.value)}
      />

      <Suspense fallback={<div>Searching...</div>}>
        <SearchedList term={term.value} />
      </Suspense>
    </div>
  )
}
