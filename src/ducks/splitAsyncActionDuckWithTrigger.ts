import { splitAsyncActionDuck } from './splitAsyncActionDuck'
import { ActionType, AsyncActionType, DuckFactory, Message, MessageCreator } from '../types'

export const splitAsyncActionDuckWithTrigger = <
  GlobalState extends object = any,
  StateBit = any,
  Key extends string = string
>(
  getKey: (message: Message) => string,
  effect: (...args: unknown[]) => Promise<StateBit>
) => (
  duckFactory: DuckFactory
): {
  TRIGGER_TYPE: ActionType
  action: MessageCreator
  EFFECT_TYPE: AsyncActionType
} => {
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
