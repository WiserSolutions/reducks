export function flagReducer(trueTypes, falseTypes, toggleTypes = [], initialValue = false) {
  return (state = initialValue, { type }) => {
    if (trueTypes.includes(type)) {
      return true
    }
    if (falseTypes.includes(type)) {
      return false
    }
    if (toggleTypes.includes(type)) {
      return !state
    }
    return state
  }
}
