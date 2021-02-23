import { takeEvery, select, put } from 'redux-saga/effects'

import { flagReducer, singleActionReducer } from '../reducers'
import { reduceAndSelectDuck } from './reduceAndSelectDuck'
import { composeDucks } from '../core'

const identity = a => a

export const confirmDuck = (action, createTriggerPayload = identity, createConfirmPayload = identity) => ({
  defineType,
  createNestedFactory
}) => {
  const TRIGGER = defineType('TRIGGER')
  const trigger = (...args) => ({ type: TRIGGER, payload: createTriggerPayload(...args) })

  const CONFIRM = defineType('CONFIRM')
  const confirm = (...args) => ({ type: CONFIRM, payload: createConfirmPayload(...args) })

  const CANCEL = defineType('CANCEL')
  const cancel = () => ({ type: CANCEL })

  const isPendingDuck = reduceAndSelectDuck(flagReducer([TRIGGER], [CANCEL, CONFIRM]))(createNestedFactory('isPending'))
  const { selector: isPending } = isPendingDuck

  const triggerPayloadDuck = reduceAndSelectDuck(singleActionReducer(TRIGGER))(createNestedFactory('trigger'))
  const { selector: getTriggerPayload } = triggerPayloadDuck

  function* performEffect({ payload }) {
    const state = yield select()
    const triggerPayload = yield select(getTriggerPayload)
    yield put(action(triggerPayload, payload, state))
  }

  const { reducer, saga } = composeDucks(isPendingDuck, triggerPayloadDuck, {
    *saga() {
      yield takeEvery(CONFIRM, performEffect)
    }
  })

  return { TRIGGER, trigger, CONFIRM, confirm, CANCEL, cancel, isPending, getTriggerPayload, reducer, saga }
}
