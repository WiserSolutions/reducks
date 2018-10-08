const identity = a => a

export const createAction = (type, getPayload = identity, getMeta = () => {}) => (...args) => ({
  type,
  payload: getPayload(...args),
  meta: getMeta(...args)
})
