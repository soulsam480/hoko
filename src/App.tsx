import { Controls } from './ui/components/controls'
import { Loading } from './ui/components/loading'
import { isInitializingDatabase } from './ui/stores'

export function App() {
  return (
    <div className='fixed top-2.5 right-2.5 flex flex-col items-end gap-2.5'>
      {!isInitializingDatabase.value && <Loading />}

      <Controls />
    </div>
  )
}
