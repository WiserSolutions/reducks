import { flagReducer } from './flagReducer'
import { message } from '../test'

describe('flagReducer', () => {
  const turnOn = message('TURN_ON')
  const turnOff = message('TURN_OFF')
  const toggle = message('TOGGLE')
  const otherMessage = message('OTHER_ACTION')
  const reducer = flagReducer([turnOn.type], [turnOff.type], [toggle.type])

  it('sets initial value to `false`', () => {
    expect(reducer(undefined, otherMessage)).toBe(false)
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
    expect(flagReducer([turnOn.type], [turnOff.type], [toggle.type], true)(undefined, otherMessage)).toBe(true)
  })

  it('ignores other actions', () => {
    expect(reducer(false, otherMessage)).toBe(false)
  })
})
