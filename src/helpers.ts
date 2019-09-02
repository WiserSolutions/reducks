import isFunction from 'lodash.isfunction'

export const resolve = <Value, Input extends any[]>(valueOrGetter: Value | ((...args: Input) => Value)) => (
  ...args: Input
): Value => {
  if (isFunction(valueOrGetter)) {
    return valueOrGetter(...args)
  }
  return valueOrGetter
}
