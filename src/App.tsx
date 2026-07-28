import { Controls } from './ui/components/controls'
import { Loading } from './ui/components/loading'
import { isInitializingDatabase } from './ui/stores'

export function App() {
  return (
    <>
      {isInitializingDatabase.value && <Loading />}

      <Controls />
    </>
  )
}
