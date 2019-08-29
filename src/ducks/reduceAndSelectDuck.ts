/**
 * Creates a reducer/selector pair.
 * @param {Function} reducer
 * @returns {Function} pass in a duck factory to create the duck
 */
export const reduceAndSelectDuck = reducer => ({ createReducer, createSelector }) => ({
  reducer: createReducer(reducer),
  selector: createSelector()
})
