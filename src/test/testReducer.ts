/* eslint-env jest */
export function testReducerChanges(reducer, initialState) {
  let state = initialState
  return (action, expectedChange) => {
    const expectedState = expectedChange(state)
    expect(reducer(state, action)).toEqual(expectedState)
    state = expectedState
  }
}

export function testReducerSelector(reducer, selector, initialState) {
  let state = initialState
  return (action, expectedValue) => {
    const newState = reducer(state, action)
    expect(selector(newState)).toEqual(expectedValue)
    state = newState
  }
}
