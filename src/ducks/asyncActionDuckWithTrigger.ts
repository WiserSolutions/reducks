import { asyncActionDuck } from './asyncActionDuck'

export const asyncActionDuckWithTrigger = effect => duckFactory => {
  const TRIGGER = duckFactory.defineType('TRIGGER')
  const trigger = duckFactory.createAction(TRIGGER)
  const { TYPE, saga, reducer, getResult, getStatus } = asyncActionDuck(TRIGGER, effect)(duckFactory)
  return {
    TRIGGER_TYPE: TRIGGER,
    action: trigger,
    EFFECT_TYPE: TYPE,
    saga,
    reducer,
    getResult,
    getStatus
  }
}
