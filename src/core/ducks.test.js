import * as reducers from './reducers'
import * as sagas from './sagas'
import { composeDucks } from './ducks'

describe('ducks', () => {
  describe('composeDucks', () => {
    const reducer = 'REDUCER'
    const saga = 'SAGA'

    beforeEach(() => {
      jest.spyOn(reducers, 'composeReducers').mockImplementation(() => reducer)
      jest.spyOn(sagas, 'composeSagas').mockImplementation(() => saga)
    })

    afterEach(() => {
      reducers.composeReducers.mockRestore()
      sagas.composeSagas.mockRestore()
    })

    it('combines reducers and sagas of the supplied ducks', () => {
      const first = { LOAD: 'LOAD', load() {}, reducer: 'first.reducer', getModel() {} }
      const second = { SAVE: 'SAVE', saga: 'second.saga' }
      const third = { reducer: 'third.reducer', saga: 'third.saga', getWhatever() {} }
      expect(composeDucks(first, second, third)).toEqual({ reducer, saga })
      expect(reducers.composeReducers).toHaveBeenCalledWith(first.reducer, third.reducer)
      expect(sagas.composeSagas).toHaveBeenCalledWith(second.saga, third.saga)
    })
  })
})
