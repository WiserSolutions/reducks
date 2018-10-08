function feedIterator(iterator, valueOrError) {
  if (valueOrError instanceof Error) {
    return iterator.throw(valueOrError)
  }
  return iterator.next(valueOrError)
}

export function runIterator(iterator, args) {
  return args.map(arg => feedIterator(iterator, arg).value)
}

export function runIteratorToEnd(iterator, args = []) {
  const results = []
  let i = 0
  let result
  do {
    result = feedIterator(iterator, args[i++])
    if (!result.done) {
      results.push(result.value)
    }
  } while (!result.done)
  return results
}
