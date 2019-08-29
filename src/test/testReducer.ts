import { Reducer } from 'redux'

import { Message, Selector } from '../types'

/* eslint-env jest */
export function testReducerChanges<State>(
  reducer: Reducer<State>,
  initialState: State
): (message: Message, expectedChange: (prevState: State) => State) => void {
  let state = initialState
  return (message, expectedChange): void => {
    const expectedState = expectedChange(state)
    expect(reducer(state, message)).toEqual(expectedState)
    state = expectedState
  }
}

export function testReducerSelector<State, Selection>(
  reducer: Reducer<State>,
  selector: Selector<State, Selection>,
  initialState: State
): (message: Message, expectedValue: unknown) => void {
  let state = initialState
  return (message, expectedValue): void => {
    const newState = reducer(state, message)
    expect(selector(newState)).toEqual(expectedValue)
    state = newState
  }
}
