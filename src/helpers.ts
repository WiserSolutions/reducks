import isFunction from 'lodash.isfunction'

export const resolve = valueOrGetter => (...args) => {
  if (isFunction(valueOrGetter)) {
    return valueOrGetter(...args)
  }
  return valueOrGetter
}
