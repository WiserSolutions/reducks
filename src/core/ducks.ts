import { composeSagas } from './sagas'
import { composeReducers } from './reducers'

const pluckExisting = (collection, key) => collection.map(item => item[key]).filter(Boolean)

export function composeDucks(...ducks) {
  return {
    saga: composeSagas(...pluckExisting(ducks, 'saga')),
    reducer: composeReducers(...pluckExisting(ducks, 'reducer'))
  }
}
