// @ts-nocheck
import { Database } from 'bun:sqlite'

function logStep(msg: string) {
  console.log(`[make_db] ${msg}`)
}

async function main() {
  const start = performance.now()

  logStep('opening source databases...')
  const routesSrc = new Database('public/routes.db')
  const stopsSrc = new Database('public/stops.db')
  const joinsSrc = new Database('public/stop_to_trips.db')

  logStep('creating target database...')
  const db = new Database('public/hoko_index.db')

  db.exec(`CREATE TABLE stops (
	  id INTEGER PRIMARY KEY,
	  name TEXT NOT NULL,
	  lat REAL NOT NULL,
	  lon REAL NOT NULL
	);

	CREATE TABLE routes (
	  id INTEGER PRIMARY KEY,
	  name TEXT NOT NULL,
	  full_name TEXT NOT NULL,
	  direction INTEGER NOT NULL,
	  start TEXT NOT NULL,
	  stop TEXT NOT NULL
	);

	CREATE TABLE routes_to_stops (
	  stop_id INTEGER NOT NULL,
	  route_id INTEGER NOT NULL,

	  PRIMARY KEY (stop_id, route_id),

	  FOREIGN KEY (stop_id) REFERENCES stops(id),
	  FOREIGN KEY (route_id) REFERENCES routes(id)
	);

	CREATE INDEX idx_stops_lat_lon
	ON stops(lat, lon);

	CREATE INDEX idx_routes_to_stops_stop
	ON routes_to_stops(stop_id);

	CREATE INDEX idx_routes_to_stops_route
	ON routes_to_stops(route_id);`)

  // 1. Load stops (lazy iterate)
  logStep('loading stops...')
  const t1 = performance.now()
  const insertStop = db.prepare(
    'INSERT INTO stops (id, name, lat, lon) VALUES (?1, ?2, ?3, ?4)'
  )
  let stopCount = 0
  let badStopIds = 0
  db.transaction(() => {
    for (const row of stopsSrc
      .query('SELECT id, name, lat, lon FROM stops')
      .iterate()) {
      const id = parseInt(row.id)
      if (isNaN(id)) {
        badStopIds++
        continue
      }
      insertStop.run(id, row.name, row.lat, row.lon)
      stopCount++
      if (stopCount % 5000 === 0) {
        logStep(`  ... ${stopCount} stops inserted`)
      }
    }
  })()
  logStep(
    `  done: ${stopCount} stops inserted${badStopIds > 0 ? `, ${badStopIds} with non-numeric id skipped` : ''} (${(performance.now() - t1).toFixed(0)}ms)`
  )

  // 2. Load routes (lazy iterate, deduplicate by id, prefer direction=0 via ORDER BY)
  logStep('loading routes...')
  const t2 = performance.now()
  const insertRoute = db.prepare(
    'INSERT INTO routes (id, name, full_name, direction, start, stop) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  )
  const seenRouteIds = new Set<number>()
  let routeCount = 0
  let dupeRoutes = 0
  db.transaction(() => {
    for (const row of routesSrc
      .query(
        'SELECT id, name, full_name, direction, init_stop, end_stop FROM routes ORDER BY direction'
      )
      .iterate()) {
      if (seenRouteIds.has(row.id)) {
        dupeRoutes++
        continue
      }
      seenRouteIds.add(row.id)
      insertRoute.run(
        row.id,
        row.name,
        row.full_name,
        row.direction,
        row.init_stop,
        row.end_stop
      )
      routeCount++
    }
  })()
  logStep(
    `  done: ${routeCount} routes inserted, ${dupeRoutes} duplicates skipped (${(performance.now() - t2).toFixed(0)}ms)`
  )

  // 3. Build route name -> id lookup
  logStep('building route name lookup...')
  const t3 = performance.now()
  const nameToId = new Map<string, number>()
  for (const r of db.query('SELECT id, name FROM routes').iterate()) {
    nameToId.set(r.name, r.id)
  }
  logStep(
    `  done: ${nameToId.size} names mapped (${(performance.now() - t3).toFixed(0)}ms)`
  )

  // 4. Load join table (lazy iterate)
  logStep('loading stop-to-route joins...')
  const t4 = performance.now()
  const insertJoin = db.prepare(
    'INSERT OR IGNORE INTO routes_to_stops (stop_id, route_id) VALUES (?1, ?2)'
  )
  let joinCount = 0
  let skipped = 0
  let badJoinIds = 0
  let badJson = 0
  const unknownNames = new Set<string>()
  db.transaction(() => {
    for (const row of joinsSrc
      .query('SELECT id, stops FROM stops_to_routes')
      .iterate()) {
      const stopId = parseInt(row.id)
      if (isNaN(stopId)) {
        badJoinIds++
        continue
      }
      let names: string[]
      try {
        names = JSON.parse(row.stops)
      } catch {
        badJson++
        continue
      }
      for (const name of names) {
        const routeId = nameToId.get(name)
        if (routeId !== undefined) {
          insertJoin.run(stopId, routeId)
          joinCount++
        } else {
          unknownNames.add(name)
          skipped++
        }
      }
      if ((joinCount + skipped) % 10000 === 0) {
        logStep(`  ... ${joinCount} joins inserted`)
      }
    }
  })()
  logStep(`  done: ${joinCount} join rows inserted, ${skipped} skipped`)
  if (badJoinIds > 0)
    logStep(`  ${badJoinIds} rows with non-numeric stop id skipped`)
  if (badJson > 0) logStep(`  ${badJson} rows with malformed JSON skipped`)
  if (unknownNames.size > 0) {
    logStep(
      `  ${unknownNames.size} unknown route names: ${[...unknownNames].slice(0, 10).join(', ')}${unknownNames.size > 10 ? '...' : ''}`
    )
  }
  logStep(`  (${(performance.now() - t4).toFixed(0)}ms)`)

  logStep(`all done (${(performance.now() - start).toFixed(0)}ms)`)
}

main()
