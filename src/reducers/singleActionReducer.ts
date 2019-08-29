export function singleActionReducer(type, reduce = (state, { payload } = {}) => payload, initialValue = undefined) {
  return (state = initialValue, action) => {
    if (action.type === type) {
      return reduce(state, action)
    }
    return state
  }
}
