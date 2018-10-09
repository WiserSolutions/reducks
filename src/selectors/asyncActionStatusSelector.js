import { combineSelectors } from '../core'

export const asyncActionStatusSelector = ({ createSelector }) =>
  combineSelectors({
    isPending: createSelector('isPending'),
    error: createSelector('error')
  })
