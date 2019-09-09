import { Reducer, Action } from 'redux'
import { Saga } from 'redux-saga'
import { ActionMatchingPattern, ActionPattern, Effect } from '@redux-saga/types'

// region: Types

declare type Function = (...args: any[]) => any
declare type Identity = <T>(arg: T) => T

declare type MessagePattern<Guard extends Action = Action> = ActionPattern<Guard>
declare type MessageMatchingPattern<P extends ActionPattern> = ActionMatchingPattern<P>

/**
 * Path for addressing deep object properties, as accepted by `lodash.get`.
 */
export type ObjectPath = string | string[]

/**
 * Redux messages (a.k.a. "actions") are distinguished by `type`.
 * Making it a string is recommended and expected by this library.
 */
export type MessageType = string

declare enum AsyncMessageTypeKey {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failure = 'FAILURE'
}

/**
 * The concept of asynchronous actions is formalised by this library with promises as the basis.
 * Asynchronous actions are expected to emit 3 types of messages:
 *  - "pending" message on start,
 *  - either a "success" or a "failure" message on finish.
 * The `AsyncActionMessageTypes` triplet is usually handed around instead of separate `MessageType`s when
 * dealing with async actions.
 */
export interface AsyncActionMessageTypes {
  [AsyncMessageTypeKey.Pending]: MessageType
  [AsyncMessageTypeKey.Success]: MessageType
  [AsyncMessageTypeKey.Failure]: MessageType
}

/**
 * Helpers in this library expect messages to be formatted using "Standard Flux Actions" model.
 */
export interface Message<Type extends MessageType = MessageType, Payload = any, Meta = any> extends Action {
  type: Type
  payload: Payload
  meta?: Meta
}

/**
 * Messages produced by async actions using `asyncActionSaga` (or some of the advanced helpers that use it)
 * describe only the async action itself, not its trigger, but they always contain the trigger message in
 * `meta.trigger`.
 */
export interface AsyncActionMessageMeta<TriggerMessage> {
  trigger: TriggerMessage
}

/**
 * This library makes a distinction between "actions" (what actually happened) and "messages" (what got emitted
 * into the Redux system). The term "action" is used here to describe both the message _creators_ and their
 * use, but not the messages themselves.
 */
export type MessageCreator<
  Type extends MessageType = MessageType,
  Args extends any[] = any[],
  Payload = unknown,
  Meta = unknown
> = (...args: Args) => Message<Type, Payload, Meta>

/**
 * Selector is a function for getting a particular bit from a larger state. This creates
 * an abstraction layer, so that the rest of the application doesn't need to care about the shape of
 * a particular composed state.
 */
export type Selector<Selection = any, State = any> = (state: State) => Selection

/**
 * `Duck` is a high-level self-contained unit of state management introduced by this library. It should
 * manage a single piece of state and provide access to it, though it has access to all of it, so as
 * to be able to inter-operate with other `Duck`s. Alternatively, it may manage side-effects to facilitate
 * this inter-operation.
 * A duck always exports a reducer (to manage the state) and/or a saga (to manage side-effects).
 * These exports are used to composes "ducks" to create a single one, the reducer and saga of which are
 * then registered with Redux. Other exported properties (usually message types, message creators, and
 * selectors) form the outer API used by the rest of the application.
 */
export type Duck<PublicApi extends object = {}, GlobalState extends object = {}> = {
  reducer?: Reducer<GlobalState>
  saga?: Saga
} & PublicApi

/**
 * `DuckFactory` greatly simplifies creation and composition of `Duck`s. It provides "namespaced"
 * versions of the core helpers and stores the created ducks, so that their collection, composition,
 * and export can be done in a single simple step at the end of the file.
 * @see `createDuckFactory` or `ducks`
 */
export interface DuckFactory<GlobalState extends object = any, LocalState = any> {
  // verbose API
  /**
   * Defines namespaced message type.
   * @param base
   */
  defineType: (base: string) => MessageType
  /**
   * Defines namespaced message type triplet for an async action.
   * @param base
   */
  defineAsyncType: typeof defineAsyncType
  /**
   * Creates a message creator (no difference from core helper).
   * @param type
   * @param getPayload transforms action's arguments to message `payload` (takes first argument by default)
   * @param getMeta transforms action's arguments to message `meta` (nothing by default)
   */
  createAction: typeof createAction
  /**
   * Given a reducer that operates on the "local" piece of state, creates a reducer that does the same
   * thing but operates on the full global state.
   * @param reducer
   */
  createReducer: (reducer: Reducer<LocalState>) => Reducer<GlobalState>
  /**
   * Given a selector that operates on the "local" piece of state, creates a selector for retrieving
   * the same thing from the full global state.
   * @param selector
   */
  createSelector: <Selection>(selector?: Selector<Selection, LocalState>) => Selector<Selection, GlobalState>
  /**
   * Returns the path (on the full global state) to the "local" piece of state.
   * @param path
   */
  getPath: (path: ObjectPath) => string[]
  /**
   * Feeds the duck factory to a duck creator and returns the created duck, but also stores it to be
   * collected later.
   * @param duckCreator
   */
  createDuck: <PublicApi extends object>(
    duckCreator: DuckCreator<PublicApi, GlobalState, LocalState>
  ) => Duck<PublicApi, GlobalState>
  /**
   * Creates a duck that just contains the provided saga and stores it to be collected later.
   * @param saga
   */
  createSagaDuck: (saga: Saga) => Duck<{ saga: Saga }, GlobalState>
  /**
   * Creates a nested duck factory, i.e. one that manages a nested piece of state. Stores the "child"
   * factory to be able to collect its ducks later.
   * @param subPath
   */
  createNestedFactory: <SubState>(subPath: ObjectPath) => DuckFactory<GlobalState, SubState>
  /**
   * Collects all ducks created by this factory and its descendants (created with `createNestedFactory`).
   */
  collectCreatedDucks: () => Duck<GlobalState>[]
  /**
   * Collects all ducks created by this factory and its descendants and composed them into a single
   * duck (i.e. `{ reducer, saga }`).
   */
  collectAndComposeCreatedDucks: () => Duck<GlobalState>

  // terse API
  /** `defineType` alias */
  type: (type: string) => string
  /** `defineAsyncType` alias */
  asyncType: typeof defineAsyncType
  /** `createAction` alias */
  action: typeof createAction
  /** `createReducer` alias */
  reducer: (reducer: Reducer<LocalState>) => Reducer<GlobalState>
  /** `createSelector` alias */
  selector: <Selection>(selector?: Selector<LocalState, Selection>) => Selector<GlobalState, Selection>
  /** `getPath` alias */
  path: (path: ObjectPath) => string[]
  /** `createDuck` alias */
  duck: <PublicApi extends object>(
    duckCreator: DuckCreator<PublicApi, GlobalState, LocalState>
  ) => Duck<PublicApi, GlobalState>
  /** `createSagaDuck` alias */
  saga: (saga: Saga) => Duck<{ saga: Saga }, GlobalState>
  /** `createNestedFactory` alias */
  nest: <SubState>(subPath: ObjectPath) => DuckFactory<GlobalState, SubState>
  /** `collectAndComposeCreatedDucks` alias */
  collect: () => Duck<GlobalState>
}

export type DuckCreator<PublicApi extends object, GlobalState extends object = any, LocalState = any> = (
  factory: DuckFactory<GlobalState, LocalState>
) => Duck<PublicApi, GlobalState>

// endregion
// region: Core

/**
 * Checks that the message type constant isn't a duplicate of another already defined file and marks
 * the value as reserved for further checks. (Since message types are global, they could otherwise
 * easily conflict, the results of which could be quite ugly.)
 * @param type
 */
export function defineType<Type extends MessageType>(type: Type): Type

/**
 * Creates a message types triplet for an async action. Reserves the types and throws on conflict.
 * @param base prefix for the produced message types
 */
export function defineAsyncType<Types extends AsyncActionMessageTypes>(base: string): Types

/**
 * Creates a factory for messages of specific type. Supplied parameters define how the action's arguments
 * transform into the message `payload` (and possibly also `meta`).
 * @param type
 * @param getPayload transforms action's arguments to message `payload` (takes first argument by default)
 * @param getMeta transforms action's arguments to message `meta` (nothing by default)
 */
export function createAction<
  Type extends MessageType = MessageType,
  Args extends any[] = any[],
  Payload = unknown,
  Meta = unknown
>(
  type: Type,
  getPayload?: (...args: Args) => Payload,
  getMeta?: (...args: Args) => Meta
): MessageCreator<Type, Args, Payload, Meta>

/**
 * Composes multiple reducers into a single reducer (functional composition).
 * @param reducers
 */
export function composeReducers<State>(...reducers: Reducer<State>[]): Reducer<State>

/**
 * Combines a map of reducers managing bits of state into a reducer that manages a map of those bits.
 * @param reducers
 */
export function combineReducers<State extends object>(
  reducers: { [K in keyof State]: Reducer<State[K]> }
): Reducer<State>

/**
 * Given an object path, creates a selector for that path. Given a function, it just returns it.
 * @param selector
 */
export function createSelector<Selection, State>(selector: ObjectPath | Selector<Selection, State>): Selection

/**
 * Combines a map of selectors selecting bits of state into a selector that produces a map of those bits.
 * @param selectorMap
 */
export function combineSelectors<Selection, State extends object>(
  selectorMap: { [K in keyof State]: Selector<any, State[K]> }
): Selection

/**
 * Composes multiple ducks into a single duck (i.e. `{ reducer, saga }`) to allow further composition
 * up until registration with the Redux system.
 * @param ducks
 */
export function composeDucks<GlobalState extends object>(...ducks: Duck<GlobalState>[]): Duck<GlobalState>

/**
 * Given an object path, creates a duck factory that namespaces all its products to that path.
 * The factory helpers then create namespaced message types, reducers scoped to the bit of
 * global state at that path, selectors scoped to that bit of state, etc.
 * The factory also provide helpers to allow creation of whole scoped "ducks" and nested factories
 * without the need to manually compose the results.
 * @param path
 *
 * @example State management using `createDuckFactory` may look like this…
 * ```javascript
 * import { createDuckFactory } from '@wisersolutions/reducks'
 * // … imports of effects, etc.
 *
 * const { defineType, createAction, createDuck, createNestedDuck, collectAndComposeCreatedDucks } = createDuckFactory('some.path')
 *
 * export const ENTER = defineType('ENTER')
 * export const enter = createAction(ENTER)
 * export const { getResult: getSomeStuff } = createDuck(asyncActionDuck(ENTER, loadSomeStuff))
 *
 * export const { turnOn: enableBork, turnOff: disableBork } = createNestedDuck('bork').createDuck(flagDuck())
 *
 * export const { reducer, selector } = collectAndComposeCreatedDucks()
 * ```
 */
export function createDuckFactory<GlobalState extends object, LocalState>(
  path: ObjectPath
): DuckFactory<GlobalState, LocalState>

/**
 * `createDuckFactory` alias
 *
 * @example …but there are also terse aliases that help reduce the boilerplate and expose the meat of the code:
 * ```javascript
 * import { ducks } from '@wisersolutions/reducks'
 * // … imports of effects, etc.
 *
 * const { type, action, duck, nest, collect } = createDuckFactory('some.path')
 *
 * export const ENTER = type('ENTER')
 * export const enter = action(ENTER)
 * export const { getResult: getSomeStuff } = duck(asyncActionDuck(ENTER, loadSomeStuff))
 *
 * export const { turnOn: enableBork, turnOff: disableBork } = nest('bork').duck(flagDuck())
 *
 * export const { reducer, selector } = collect()
 * ```
 */
export const ducks: typeof createDuckFactory

// endregion
// region: Reducers

/**
 * Status of an async action:
 *  - whether it's pending or finished,
 *  - if finished, whether successfully (if not, the error it failed with).
 */
export type AsyncActionStatus<Error = any> = {
  isPending: boolean
  error: Error
}

/**
 * Full state of an async action - the status of the action & the result if successfully finished.
 */
export type AsyncActionState<Result = any, Error = any> = AsyncActionStatus<Error> & {
  result: Result
}

/**
 * Reduces async action's messages into a flag indicating whether the action is currently in progress.
 * @param messageTypes
 */
export function asyncActionFlagReducer(messageTypes: AsyncActionMessageTypes): Reducer<boolean>

/**
 * Reduces async action's messages into the action's progress status.
 * @param messageTypes
 */
export function asyncActionStatusReducer<Error = any>(
  messageTypes: AsyncActionMessageTypes
): Reducer<AsyncActionStatus<Error>>

/**
 * Reduces async action's messages into the action's full state (progress, result, error).
 * @param messageTypes
 * @param reduce replaces previous result with the full payload by default
 * @param initialState
 */
export function asyncActionReducer<Result, Error = any>(
  messageTypes: AsyncActionMessageTypes,
  reduce?: Reducer<Result>,
  initialState?: Result
): Reducer<AsyncActionState<Result, Error>>

/**
 * Given a message to object path getter, reduces async action's messages into multiple separate states.
 * @param messageTypes
 * @param getPath
 * @param reduce replaces previous result (for that key) with the full payload by default
 */
export function splitAsyncActionReducer<Result = any>(
  messageTypes: AsyncActionMessageTypes,
  getPath: (message: Message<typeof messageTypes[keyof typeof messageTypes]>) => ObjectPath,
  reduce?: Reducer<Result>
): Reducer<Record<string, AsyncActionState<Result>>>

/**
 * Given lists of message types corresponding to "set to true", "set to false", and "toggle", it reduces
 * those messages into a boolean flag.
 * @param trueTypes
 * @param falseTypes
 * @param toggleTypes
 * @param initialValue false by default
 */
export function flagReducer(
  trueTypes: MessageType[],
  falseTypes: MessageType[],
  toggleTypes?: MessageType[],
  initialValue?: boolean
): Reducer<boolean>

/**
 * Given a message type, creates a reducer that consumes only messages of that type.
 * @param type
 * @param reduce replaces previous state with the message's full payload by default
 * @param initialValue
 */
export function singleActionReducer<State = any, Type extends MessageType = MessageType>(
  type: Type,
  reduce?: Reducer<State, Message<Type>>,
  initialValue?: State
): Reducer<State, Message>

// endregion
// region: Effects

/**
 * A more complex version of `takeLatest`. Given a message to key getter, considers "latest"
 * (and cancels pending previous task) separately for each unique key. (Useful when using
 * a single async action to fetch multiple entities concurrently.)
 * @param patternOrChannel
 * @param getKey
 * @param worker
 * @param args
 */
export function takeLatestBy<
  Pattern extends MessagePattern,
  Fn extends (message: Msg, ...args: Args) => any,
  Msg extends Message = any,
  Args extends any[] = any[]
>(patternOrChannel: Pattern, getKey: (message: Msg) => string, worker: Fn, ...args: Args): Effect

// endregion
// region: Sagas

/**
 * Given message types for an async action and an effect, creates a saga that runs the effect
 * on each received trigger and emits relevant messages.
 * @param messageTypes
 * @param effect the async effect to perform on each trigger
 * @param options
 * @param options.getArgs get arguments for effect (defaults to `[message.payload, state, message]`)
 * @param options.getMeta create `meta` for all the async action's messages (defaults to `{ trigger: message }`)
 */
export function asyncActionSaga<
  Types extends AsyncActionMessageTypes,
  Result = any,
  Trigger extends MessageType = MessageType,
  Args extends any[] = any[],
  GlobalState = any
>(
  messageTypes: Types,
  effect: (...args: Args) => Promise<Result>,
  options: {
    getArgs?: (message: Trigger, state?: GlobalState) => Args
    getMeta?: (message: Trigger, state?: GlobalState) => AsyncActionMessageMeta<Trigger>
  }
): Saga<[Trigger]>

/**
 * Given a map of message types to effects, creates a saga that consumes messages of those types
 * and triggers the corresponding effects.
 * @param typeToSideEffectMap
 */
export function sideEffectsMapSaga(
  typeToSideEffectMap: Record<MessageType, (payload: unknown, message: Message, state: unknown) => Effect>
): Saga

// endregion
// region: Ducks

/**
 * Given a trigger and an async effect, creates a saga that executes the effect on the latest trigger,
 * emitting appropriate messages and storing (and providing access to) the effect's state.
 * @param trigger
 * @param effect
 */
export function asyncActionDuck<TriggerPattern extends MessagePattern, Result, GlobalState extends object = any>(
  trigger: TriggerPattern,
  effect: <TriggerMessage extends MessageMatchingPattern<TriggerPattern> & Message>(
    triggerPayload: TriggerMessage['payload'],
    state: GlobalState,
    triggerMessage: TriggerMessage
  ) => Promise<Result>
): DuckCreator<
  {
    TYPE: AsyncActionMessageTypes
    saga: Saga
    reducer: Reducer<GlobalState>
    getResult: Selector<Result, GlobalState>
    getStatus: Selector<AsyncActionStatus, GlobalState>
  },
  GlobalState,
  AsyncActionState<Result>
>

declare type AsyncActionDuckWithTriggerApi<TriggerType extends MessageType, TriggerPayload, Result, GlobalState> = {
  TRIGGER_TYPE: TriggerType
  action: MessageCreator<TriggerType, [TriggerPayload], TriggerPayload>
  EFFECT_TYPE: AsyncActionMessageTypes
  saga: Saga
  reducer: Reducer<GlobalState>
  getResult: Selector<Result, GlobalState>
  getStatus: Selector<AsyncActionStatus, GlobalState>
}

/**
 * Given an async effect, creates a message type (and action) to act as a trigger and feeds it
 * to `asyncActionDuck` along with the effect.
 * @param effect
 */
export function asyncActionDuckWithTrigger<TriggerArg, Result, GlobalState extends object = any>(
  effect: (
    triggerPayload: TriggerArg,
    state: GlobalState,
    triggerMessage: Message<MessageType, TriggerArg>
  ) => Promise<Result>
): DuckCreator<
  AsyncActionDuckWithTriggerApi<MessageType, TriggerArg, Result, GlobalState>,
  GlobalState,
  AsyncActionState<Result>
>

declare type ConfirmDuckApi<
  TriggerPayloadCreator extends Function,
  ConfirmPayloadCreator extends Function,
  GlobalState,
  TriggerType extends MessageType = MessageType,
  ConfirmType extends MessageType = MessageType,
  CancelType extends MessageType = MessageType
> = {
  TRIGGER: TriggerType
  trigger: MessageCreator<TriggerType, Parameters<TriggerPayloadCreator>, ReturnType<TriggerPayloadCreator>>
  CONFIRM: ConfirmType
  confirm: MessageCreator<ConfirmType, Parameters<ConfirmPayloadCreator>, ReturnType<ConfirmPayloadCreator>>
  CANCEL: CancelType
  cancel: MessageCreator<CancelType, [], undefined>
  isPending: Selector<boolean, GlobalState>
  getTriggerPayload: Selector<ReturnType<TriggerPayloadCreator>, GlobalState>
  reducer: Reducer<GlobalState>
  saga: Saga
}

/**
 * Given an action, wraps confirmation logic around it.
 * @param action
 * @param createTriggerPayload
 * @param createConfirmPayload
 *
 * @example
 * ```javascript
 * import { ducks } from '@wisersolutions/reducks'
 * import * as usersApi from 'wherever'
 *
 * const { nest, collect } = ducks('users')
 *
 * // note that the real removal action isn't needed by the rest of the application, just the confirmation logic actions
 * const { trigger: removeUser } = nest('removal').duck(asyncActionDuckWithTrigger(::usersApi.remove))
 * export const {
 *   trigger: attemptUserRemoval,
 *   confirm: confirmUserRemoval,
 *   cancel: cancelUserRemoval
 * } = nest('removalConfirmation').duck(confirmDuck(removeUser))
 *
 * export const { reducer, saga } = collect()
 * ```
 */
export function confirmDuck<
  TriggerPayloadCreator extends Function = Identity,
  ConfirmPayloadCreator extends Function = Identity,
  GlobalState extends object = any
>(
  action: MessageCreator,
  createTriggerPayload: TriggerPayloadCreator,
  createConfirmPayload: ConfirmPayloadCreator
): DuckCreator<
  ConfirmDuckApi<TriggerPayloadCreator, ConfirmPayloadCreator, GlobalState>,
  GlobalState,
  {
    trigger: ReturnType<TriggerPayloadCreator>
    isPending: boolean
  }
>

declare type FlagDuckApi<
  GlobalState,
  TurnOnType extends MessageType = MessageType,
  TurnOffType extends MessageType = MessageType,
  ToggleType extends MessageType = MessageType
> = {
  TURN_ON_TYPE: TurnOnType
  TURN_OFF_TYPE: TurnOffType
  TOGGLE_TYPE: ToggleType
  turnOn: MessageCreator<TurnOnType, [], undefined>
  turnOff: MessageCreator<TurnOffType, [], undefined>
  toggle: MessageCreator<ToggleType, [], undefined>
  reducer: Reducer<GlobalState, Message<TurnOnType | TurnOffType | ToggleType>>
  selector: Selector<boolean, GlobalState>
}

/**
 * Creates actions to indicate either explicitly setting or toggling a boolean flag and stores
 * (and provides access to) its state.
 * @param initialValue defaults to `false`
 */
export function flagDuck<GlobalState extends object = any>(
  initialValue: boolean
): DuckCreator<FlagDuckApi<GlobalState>, GlobalState, boolean>

declare type FormEditMessageCreator<EditType extends MessageType, EditPayload = any> = MessageCreator<
  EditType,
  [EditPayload, { replace: boolean }],
  EditPayload,
  { replace: boolean }
>
declare type FormDuckApi<
  Model,
  FormState,
  GlobalState,
  LoadType extends AsyncActionMessageTypes = AsyncActionMessageTypes,
  SaveType extends AsyncActionMessageTypes = AsyncActionMessageTypes,
  EditType extends MessageType = MessageType,
  ChangeType extends MessageType = MessageType,
  SubmitType extends MessageType = MessageType
> = {
  LOAD: LoadType
  EDIT: EditType
  CHANGE: ChangeType
  SUBMIT: SubmitType
  SAVE: SaveType
  edit: FormEditMessageCreator<EditType>
  submit: MessageCreator<SubmitType>
  reducer: Reducer<GlobalState>
  getFormState: Selector<FormState, GlobalState>
  getModel: Selector<Model, GlobalState>
  getLoadStatus: Selector<AsyncActionStatus, GlobalState>
  getSaveStatus: Selector<AsyncActionStatus, GlobalState>
  saga: Saga
}

/**
 * Given a reset type and at least a data loader, creates logic and API for form state management -
 * - edit & submit actions, selectors for current model and form state, and statuses of load & save
 * actions.
 * @param RESET
 * @param options
 *
 * @note Use of `formDuck` is not recommended, as it's a random abstraction for something quite complex
 * with likely many solid full-fledged abstractions available.
 */
export function formDuck<
  Model,
  FormState,
  Changes,
  GlobalState extends object = any,
  Load extends (...args: any[]) => Promise<Model> = (...args: any[]) => Promise<Model>,
  Save extends (model: Model, state: GlobalState, submitPayload: any) => Promise<any> = (model: Model) => Promise<any>
>(
  RESET: MessagePattern,
  options: {
    load: Load
    save?: Save
    toFormState?: (model: Model) => FormState
    toModel?: (formState: FormState) => Model
    transformChanges?: (editPayload: any, formState: FormState) => Changes
    applyChanges?: (formState: FormState, changes: Changes) => FormState
    CLEAR: MessagePattern
  }
): DuckCreator<
  FormDuckApi<Model, FormState, GlobalState>,
  GlobalState,
  {
    formState: FormState
    model: Model
    load: AsyncActionStatus
    save: AsyncActionStatus
  }
>

/**
 * Given an existing form duck (or at least a few relevant message types), creates a debounced async
 * form validation effect and provides access to its status and result.
 * @param formMessageTypes
 * @param validate
 * @param options
 * @param options.getErrors unwrap errors from validation failure
 * @param options.getSaveErrors unwrap errors from save failure
 */
export function formValidationDuck<Model, ValidationError, GlobalState extends object = any>(
  formMessageTypes: { LOAD: AsyncActionMessageTypes; CHANGE: MessageType; SAVE: AsyncActionMessageTypes },
  validate: (model: Model) => Promise<any>,
  options: {
    debounceDelay?: number
    getErrors?: Function
    getSaveErrors?: Function
  }
): DuckCreator<
  {
    reducer: Reducer<GlobalState>
    getErrors: Selector<ValidationError[], GlobalState>
    getStatus: Selector<AsyncActionStatus, GlobalState>
    saga: Saga
  },
  GlobalState,
  {
    errors: ValidationError[]
    status: AsyncActionStatus
  }
>

/**
 * Creates a simple bit of direct state management - an action to set the state and access to the current value.
 * @param initialValue
 */
export function getSetDuck<Value, GlobalState extends object = any>(
  initialValue: Value
): DuckCreator<
  {
    TYPE: MessageType
    action: MessageCreator<MessageType, [Value], Value>
    reducer: Reducer<GlobalState>
    selector: Selector<Value, GlobalState>
  },
  GlobalState,
  Value
>

/**
 * Given some external storage (e.g. a wrapper around `localStorage`) and applied to some already managed state,
 * populates that state from storage on store init (replacing its own default value) and persists the current
 * value to storage on state changes.
 * @param storage
 * @param triggers limit calls to `storage.set` by selecting messages that trigger the state-to-storage update
 * @param resetTriggers force re-initialization from storage in reaction to specific messages
 */
export function persistenceDuck<Value, GlobalState extends object = any>(
  storage: { get: (key: string) => Value; set: (key: string, value: Value) => void },
  triggers: MessagePattern,
  resetTriggers?: MessageType[]
): DuckCreator<
  {
    reducer: Reducer<GlobalState, MessageMatchingPattern<typeof triggers>>
    saga: Saga
  },
  GlobalState
>

/**
 * Given a plain reducer (applicable to local state), wraps it to work on global state and creates
 * a selector providing access to the stored value.
 * @param reducer
 */
export function reduceAndSelectDuck<Value, GlobalState extends Object = any>(
  reducer: Reducer<Value>
): DuckCreator<
  {
    reducer: Reducer<GlobalState>
    selector: Selector<Value, GlobalState>
  },
  GlobalState,
  Value
>

/**
 * Given a message type pattern, a message to key getter, and an effect, creates a saga that is triggered
 * by those messages, takes the last one per each unique key, and executes the effect with it. The results
 * and statuses of those parallel effects are stored and provided access to (both as a whole and individually
 * through parametrized getters).
 * @param messagePattern
 * @param getKey
 * @param effect
 * @param reduce customize result to state reduction (e.g. to support pagination)
 */
export function splitAsyncActionDuck<
  Msg extends Message,
  Result,
  GlobalState extends object = any,
  Key extends string = string
>(
  messagePattern: MessagePattern,
  getKey: (trigger: Msg) => Key,
  effect: (triggerPayload: Msg['payload'], state: GlobalState, trigger: Msg) => Promise<Result>,
  reduce?: Reducer<Result>
): DuckCreator<
  {
    TYPE: AsyncActionMessageTypes
    saga: Saga
    reducer: Reducer<GlobalState>
    getResults: Selector<Record<Key, Result>, GlobalState>
    getStatuses: Selector<Record<Key, AsyncActionStatus>, GlobalState>
    getResult: (key: Key) => Selector<Result, GlobalState>
    getStatus: (key: Key) => Selector<AsyncActionStatus, GlobalState>
  },
  GlobalState,
  Record<Key, AsyncActionState<Result>>
>

/**
 * Given a trigger to key getter and an effect, creates a simple trigger action and feeds it to
 * `splitAsyncActionDuck` along with the supplied arguments.
 * @param getKey
 * @param effect
 * @param reduce
 */
export function splitAsyncActionDuckWithTrigger<
  TriggerArg,
  Result,
  GlobalState extends object = any,
  Key extends string = string,
  TriggerType extends MessageType = MessageType
>(
  getKey: (trigger: Message<TriggerType, TriggerArg>) => Key,
  effect: (triggerPayload: TriggerArg, state: GlobalState, trigger: Message<TriggerType, TriggerArg>) => Promise<Result>,
  reduce?: Reducer<Result>
): DuckCreator<
  {
    TRIGGER_TYPE: TriggerType
    action: MessageCreator<TriggerType, [TriggerArg], TriggerArg>
    EFFECT_TYPE: AsyncActionMessageTypes
    saga: Saga
    reducer: Reducer<GlobalState>
    getResults: Selector<Record<Key, Result>, GlobalState>
    getStatuses: Selector<Record<Key, AsyncActionStatus>, GlobalState>
    getResult: (key: Key) => Selector<Result, GlobalState>
    getStatus: (key: Key) => Selector<AsyncActionStatus, GlobalState>
  },
  GlobalState,
  Record<Key, AsyncActionState<Result>>
>

// endregion
// region: Misc

/**
 * Given a path and a message type, creates a duck decorator that wraps a duck's reducer to
 * reset the state to its default value (retrieved by performing mock init with the reducer) on
 * the selected messages.
 * @param path
 * @param resetType
 *
 * @note Using `resetState` is not recommended as it is a needlessly convoluted construct. Standard
 * reducer composition should suffice.
 */
export function resetState<D extends Duck>(path: ObjectPath, resetType: MessageType): (duck: D) => D

// endregion
