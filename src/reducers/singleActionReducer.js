export function singleActionReducer(type, reduce = (state, { payload } = {}) => payload, initialValue = undefined) {
  return (state = initialValue, action, ...args) => {
    if (action.type === type) {
      return reduce(state, action, ...args)
    }
    return state
  }
}
