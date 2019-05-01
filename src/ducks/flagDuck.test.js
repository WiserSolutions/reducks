import { createDuckFactory } from '../core'
import { flagDuck } from './flagDuck'
import { testReducerSelector } from '../test/testReducer'

describe('flagDuck', () => {
  const factory = createDuckFactory('test.duck')

  it('defines types setting/toggling a flag, reducer to store it, and selector to retrieve it', async () => {
    const { TURN_ON_TYPE, TURN_OFF_TYPE, TOGGLE_TYPE, turnOn, turnOff, toggle, reducer, selector } = flagDuck()(factory)

    expect(TURN_ON_TYPE).toEqual('test.duck.ON')
    expect(TURN_OFF_TYPE).toEqual('test.duck.OFF')
    expect(TOGGLE_TYPE).toEqual('test.duck.TOGGLE')

    expect(turnOn()).toEqual({ type: TURN_ON_TYPE })
    expect(turnOff()).toEqual({ type: TURN_OFF_TYPE })
    expect(toggle()).toEqual({ type: TOGGLE_TYPE })

    const step = testReducerSelector(reducer, selector)
    step({ type: 'TEST_INIT' }, false)
    step({ type: TURN_ON_TYPE }, true)
    step({ type: TURN_OFF_TYPE }, false)
    step({ type: TOGGLE_TYPE }, true)
    step({ type: 'IGNORED' }, true)
    step({ type: TOGGLE_TYPE }, false)
  })
})
