import { flagReducer } from '../reducers'

export const flagDuck = (initialValue = false) => ({ type, action, createReducer, createSelector }) => {
  const TURN_ON_TYPE = type('ON')
  const TURN_OFF_TYPE = type('OFF')
  const TOGGLE_TYPE = type('TOGGLE')
  const turnOn = action(TURN_ON_TYPE)
  const turnOff = action(TURN_OFF_TYPE)
  const toggle = action(TOGGLE_TYPE)
  const reducer = createReducer(flagReducer([TURN_ON_TYPE], [TURN_OFF_TYPE], [TOGGLE_TYPE], initialValue))
  const selector = createSelector()
  return { TURN_ON_TYPE, TURN_OFF_TYPE, TOGGLE_TYPE, turnOn, turnOff, toggle, reducer, selector }
}
