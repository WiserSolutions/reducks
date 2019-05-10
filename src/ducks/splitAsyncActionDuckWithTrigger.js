import { splitAsyncActionDuck } from './splitAsyncActionDuck'

export const splitAsyncActionDuckWithTrigger = (getKey, effect) => duckFactory => {
  const TRIGGER = duckFactory.type('TRIGGER')
  const trigger = duckFactory.action(TRIGGER)
  const { TYPE, ...rest } = splitAsyncActionDuck(TRIGGER, getKey, effect)(duckFactory)
  return {
    TRIGGER_TYPE: TRIGGER,
    action: trigger,
    EFFECT_TYPE: TYPE,
    ...rest
  }
}
