const typeRegistry = []

export function defineType(type) {
  if (typeRegistry.includes(type)) {
    throw new Error(`Action type "${type}" is already registered!`)
  }
  typeRegistry.push(type)
  return type
}

export const defineAsyncType = base => ({
  PENDING: defineType(`${base}.PENDING`),
  SUCCESS: defineType(`${base}.SUCCESS`),
  FAILURE: defineType(`${base}.FAILURE`)
})
