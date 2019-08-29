function feedIterator<T>(iterator: Iterator<T>, valueOrError: any | Error) {
  if (valueOrError instanceof Error) {
    if (iterator.throw) return iterator.throw(valueOrError)
    throw valueOrError
  }
  return iterator.next(valueOrError)
}

export function runIterator<T>(iterator: Iterator<T>, args: any[]) {
  return args.map(arg => feedIterator(iterator, arg).value)
}

export function runIteratorToEnd<T>(iterator: Iterator<T>, args: any[] = []) {
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
