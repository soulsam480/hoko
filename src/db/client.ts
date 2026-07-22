import { SQLocal } from 'sqlocal'

const client = new SQLocal('hoko.sqlite')

const hasDbInit = localStorage.getItem('init_db')

async function initDatabase() {
  if (hasDbInit !== null) return

  const data = await fetch('hoko_index.db').then(res => res.blob())

  await client.overwriteDatabaseFile(data)

  localStorage.setItem('init_db', 'true')
}

const dbPromise = initDatabase()

async function isReady() {
  await dbPromise
}

export { client, isReady }
