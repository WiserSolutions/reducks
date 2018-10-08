import { flagReducer } from './flagReducer'

const type = 'TEST_ACTION'
const action = payload => ({ type, payload })

describe('flagReducer', () => {
  const turnOn = { type: 'TURN_ON' }
  const turnOff = { type: 'TURN_OFF' }
  const toggle = { type: 'TOGGLE' }
  const reducer = flagReducer([turnOn.type], [turnOff.type], [toggle.type])

  it('sets initial value to `false`', () => {
    expect(reducer(undefined, action)).toBe(false)
  })

  it('sets state to `true` on "truthy" action', () => {
    expect(reducer(false, turnOn)).toBe(true)
  })

  it('sets state to `false` on "falsy" action', () => {
    expect(reducer(true, turnOff)).toBe(false)
  })

  it('toggles state on "toggle" action', () => {
    expect(reducer(false, toggle)).toBe(true)
    expect(reducer(true, toggle)).toBe(false)
  })

  it('sets a different initial value when supplied', () => {
    expect(flagReducer([turnOn.type], [turnOff.type], [toggle.type], true)(undefined, action)).toBe(true)
  })

  it('ignores other actions', () => {
    expect(reducer(false, action)).toBe(false)
  })
})
