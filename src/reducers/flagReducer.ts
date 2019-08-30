import { ActionType } from '../types'
import { Reducer } from 'redux'

export function flagReducer(
  trueTypes: ActionType[],
  falseTypes: ActionType[],
  toggleTypes: ActionType[] = [],
  initialValue = false
): Reducer<boolean> {
  return (state = initialValue, { type }): boolean => {
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
