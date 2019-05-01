/* eslint-env jest */
export function testReducerSequence(reducer, initialState) {
  let state = initialState
  return (action, expectedChange) => {
    const expectedState = expectedChange(state)
    expect(reducer(state, action)).toEqual(expectedState)
    state = expectedState
  }
}
