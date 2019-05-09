# reducks

Tools for modular state management using `redux` and `redux-saga`. The approach and name
are inspired by the [modular redux proposal](https://github.com/erikras/ducks-modular-redux).

## Use

[Redux](https://redux.js.org/) provides all the tools needed to create a single consolidated state
storage and a messaging system used by it but decoupled from it. It doesn't provide any opinions
on how to use this system. Having a singleton messaging system and state storage (together with
the way these two are implemented) makes for some serious benefits to code structure, testing,
and maintenance, but it also brings with it some specific challenges. One of them is side-effect
management, another code reuse. This package picks one of the existing solutions to the former
and provides tools to deal with the latter. Then it also provides some generic abstractions
built on top of the included tooling.

_Note: One of the basic units of Redux state management is most often called "actions". In the
author's view the name is confusing and often leads to flawed mental model of Redux. In this guide
the term "messages" is used instead and the term "actions" is used for message creators._

### Assumptions

The tools in this package assume the use of

- [redux-saga](https://redux-saga.js.org/) for side-effects and
- [FSA](https://github.com/redux-utilities/flux-standard-action) format for messages.

### Concepts

A basic unit of state management using Redux has one or more of the following:

- **message types** - constants used to identify messages,
- **actions** - functions that \[receive some parameters and\] create messages,
- **reducer** - function that receives the current state and an action to produce the next state,
- **selectors** - functions that receive state and return some specific piece of data,
- **effects** - side-effects triggered by messages that can lead to other messages being
  dispatched (here we create effects using **saga**).

Message types, reducers, and effects are considered internal implementation details of the state
management part of the application/module. Types provide the semantic bridge between messages
and reducers; reducers and effects are registered with the Redux engine to be executed automatically
when messages are dispatched.

Selectors and actions form the "public API" of state management, allowing (read-only) access
to well-defined pieces of the state and well-defined interactions (encapsulating the actual global
state structure and global message types).

A unit of state management containing the above is called a **duck**. It can look e.g. like this:

```javascript
import { updateIn } from '@hon2a/icepick-fp'
import { takeEvery, call, select } from 'redux-saga/effects'

import { getTodoFilter } from './ui'
import { saveTodos } from '../api'

// message type(s)
export const ADD_TODO_ITEM = 'ADD_TODO_ITEM'
// action(s)
export const addTodo = label => ({ type: ADD_TODO_ITEM, payload: { label, isDone: false, createdAt: Date.now() } })
// reducer
export const reducer = (state, { type, payload }) => (type === ADD_TODO_ITEM)
  ? updateIn('some.todos', todos => [...todos, payload])(state)
  : state
// selector(s)
const getAllTodos = state => state.some.todos
export const getVisibleTodos = state => getAllTodos(state).filter(getTodoFilter(state))
// effect(s)
export function* saga() {
  yield takeEvery(ADD_TODO_ITEM, function* saveTodosSaga() {
    yield call(saveTodos, yield select(getAllTodos))
  })
}
```

#### Modular Ducks (Generics)

As shown above, a duck most often manages just a single specific piece of the global state, but it
also sometimes needs to depend on other ducks' messages or state (through selectors). It doesn't
have to know the details about the rest of the state, but it does need to know where its own state
bit is located. It also doesn't need to know about all the other global message types, but it must
not conflict with them when defining own types. This means that a duck is very much "concrete" and
can't easily be reused. However, the need for reuse arises in state management just as often as with
any other code. The `createDuckFactory` helper is provided to deal with this concern (also under
the `ducks` alias). Supplied with a path descriptor, it returns a set of creators for all of the
above constructs in need of "namespacing" - message types, reducers, selectors. Using it in the
above example would yield:

```javascript
// ... (imports)
import { createDuckFactory } from '@wisersolutions/reducks'

const { defineType, createAction, createReducer, createSelector } = createDuckFactory('some.todos')
// message type(s)
export const ADD_TODO_ITEM = defineType('ADD') // 'some.todos.ADD'
// action(s)
export const addTodo = createAction(ADD_TODO_ITEM, label => ({ label, isDone: false, createdAt: Date.now() }))
// reducer
export const reducer = createReducer(
  (state, { type, payload }) => (type === ADD_TODO_ITEM) ? [...state, payload] : state
)
// selector(s)
const getAllTodos = createSelector()
// ... (the rest, unchanged)
```

While this helps avoid conflicts in message types (and the `defineType` helper actually checks for
conflicts as well) and helps simplify the reducer code, it doesn't as of itself make the code
reusable. But now that all of the duck parts are created with the duck factory helpers, making it
portable is as simple as wrapping the whole duck in a function that takes the duck factory as argument.

```javascript
export const todoListDuck = (getTodosFilter, initialState = []) => ({ defineType, createAction, createReducer, createSelector }) => {
  const ADD = defineType('ADD')
  const add = createAction(ADD, /* ... */)
  const reducer = createReducer(
    (state = initialState, { type, payload }) => (type === ADD) ? [...state, payload] : state
  )
  const selector = state => createSelector()(state).filter(getTodosFilter(state))
  function* saga() { /* ... */ }
  return { reducer, saga, ADD, add, selector }
}
```

Need multiple to-do list state managers? No problem.

```javascript
import { getTodosFilter } from './ui' // let's say the filter is common to both lists

const firstTodoListDuck = todoListDuck(getTodosFilter)(createDuckFactory('todoLists.first'))
const { add: addToFirstTodos, selector: getFirstTodos } = firstTodoListDuck

const secondTodoListDuck = todoListDuck(getTodosFilter)(createDuckFactory('todoLists.second'))
const { add: addToSecondTodos, selector: getSecondTodos } = secondTodoListDuck

const { reducer, saga } = composeDucks(firstTodoListDuck, secondTodoListDuck)
export { reducer, saga, addToFirstTodos, getFirstTodos, addToSecondTodos, getSecondTodos }
```

#### Async Actions

Simple message creators are nice, but real app needs to perform asynchronous effects and more
often than not, the status of their execution is itself a state that needs to be reflected.
To standardise this, the package introduces a `defineAsyncType` helper that instead of a single
string constant produces an object containing the `PENDING`, `SUCCESS`, and `FAILURE` properties
\- message types. More helpers are provided to help perform async effects that dispatch messages
with these async types.

### API

#### Core

The core API provides tools to help create and combine the state management pieces.

##### Types

###### defineType

`defineType` manages a registry of types and crashes on conflicts.

```javascript
const ADD_TODO = defineType('ADD_TODO') // 'ADD_TODO'
const DO_SOMETHING_ELSE = defineType('ADD_TODO') // error (conflict)
```

###### defineAsyncType

```javascript
const SAVE_TODOS = defineAsyncType('SAVE_TODOS') // { PENDING: 'SAVE_TODOS.PENDING', SUCCESS: '...', FAILURE: '...' }
const DO_SOMETHING_ELSE = defineType('SAVE_TODOS.SUCCESS') // error (conflict)
```

##### Actions

###### createAction

```javascript
const addTodo = createAction(ADD_TODO, label => ({ label })) // { type: ADD_TODO, payload: { label } }
```

##### Reducers

###### composeReducers

```javascript
const reducer = composeReducers(
  (state, { type, payload }) => (type === ADD_TODO) ? updateIn('todos', todos => [...todos, payload])(state) : state,
  (state, { type, payload }) => (type === SAVE_TODOS.SUCCESS) ? assocIn('lastSavedAt', Date.now())(state) : state,
  // ...
)
const initialState = { todos: [], lastSavedAt: undefined }
const state1 = reducer(initialState, { type: ADD_TODO, payload: { label: 'Build a time machine' } })
const state2 = reducer(state1, { type: SAVE_TODOS.SUCCESS })
// { todos: [{ label: 'Build a time machine' }], lastSavedAt: /* previous line execution timestamp */ }
```

###### combineReducers

```javascript
const reducer = combineReducers({
  todos: (state = [], { type, payload }) => (type === ADD_TODO) ? [...state, payload] : state,
  todoLastAddedAt: (state, { type, payload }) => (type === ADD_TODO) ? Date.now() : state
})
reducer({}, { type: ADD_TODO, payload: { label: 'Sleep' } })
// { todos: [{ label: 'Sleep' }], todoLastAddedAt: /* previous line execution timestamp */ }
```

##### Selectors

###### combineSelectors

```javascript
const selector = combineSelectors({
  lastTodo: state => state.todos[state.todos.length - 1],
  lastUpdate: state => state.todoLastAddedAt
})
selector({ todos: [{ label: 'Rock' }, { label: 'Roll' }], todoLastAddedAt: 123456789 })
// { lastTodo: { label: 'Roll' }, lastUpdate: 123456789 }
```

##### Sagas

###### takeOne

`takeOne(channelOrPattern, effect)` is an effect helper similar to `takeAll` or `takeEvery`.
It takes just the first matching message.

###### composeSagas

`composeSagas(...sagas)` composes sagas into a single saga that runs the inner sagas independently.

##### Ducks

###### composeDucks

`composeDucks(...ducks)` composes the reducers and sagas in the supplied ducks into a single
`{ reducer, saga }` (possibly to be composed with other ducks all the way to the top, where
the composed reducer and saga should be registered with the `redux` and `redux-saga` engines).

##### Modularity Sugar

###### createDuckFactory

`createDuckFactory` (or `ducks`) provides a set of "namespaced" creators of the other state
management constructs. See the example in the [Modular Ducks (Generics)](#modular-ducks-(generics))
section.

```javascript
const {
  // verbose API
  defineType,
  defineAsyncType,
  createAction,
  createReducer,
  createSelector,
  createNestedFactory,
  createDuck,
  collectAndComposeCreatedDucks,
  
  // terse API
  type,
  asyncType,
  action,
  reducer,
  selector,
  nest,
  duck,
  collect
} = createDuckFactory('some.path')
defineType('ADD') // or type('ADD') -> 'some.path.ADD'
defineAsyncType('SAVE') // or asyncType('SAVE') -> { PENDING: 'some.path.SAVE', SUCCESS: ..., FAILURE: ... }
createAction(ADD, createPayload, createMeta) // or action(...) -> message creator function
createReducer(reduce) // or reducer(...) -> `reduce` is passed just the bit of state at `some.path`
createSelector(select) // or selector(...) -> `select` is passed just the bit of state at `some.path`
createNestedFactory('sub.path') // or nest(...) -> createDuckFactory('some.path.sub.path')
createDuck(genericDuck) // or duck(...) -> feeds itself to generic duck (function that expects a duck factory argument)
```

`collectAndComposeCreatedDucks` (or `collect`) composes all ducks created by this factory
using `createDuck` (or `duck`) and its children created with `createNestedFactory` (or `nest`),
transitively.

#### Generics

##### Reducers

###### asyncActionReducer & friends

Following utils help store info about async actions. Assuming `const LOAD_USERS = defineAsyncType('LOAD_USERS')`:

- `asyncActionFlagReducer` stores a flag indicating whether an async action is currently pending,
    ```javascript
    const reducer = asyncActionFlagReducer(LOAD_USERS)
    reducer(undefined, { type: 'INIT' }) // -> false
    reducer(anyState, { type: LOAD_USERS.PENDING }) // -> true
    reducer(anyState, { type: LOAD_USERS.SUCCESS }) // -> false
    reducer(anyState, { type: LOAD_USERS.FAILURE }) // -> false
    ```
- `asyncActionStatusReducer` stores not just the status, but also the last error (failure payload),
    ```javascript
    const reducer = asyncActionStatusReducer(LOAD_USERS)
    reducer(undefined, { type: 'INIT' }) // -> { isPending: false, error: undefined }
    reducer(anyState, { type: LOAD_USERS.PENDING }) // -> { isPending: true, error: undefined }
    reducer(anyState, { type: LOAD_USERS.SUCCESS }) // -> { isPending: false, error: undefined }
    reducer(anyState, { type: LOAD_USERS.FAILURE, payload }) // -> { isPending: false, error: payload }
    ```
- `asyncActionReducer` stores status, last error, and last result (success payload),
    ```javascript
    const reducer = asyncActionReducer(LOAD_USERS, undefined, [])
    reducer(undefined, { type: 'INIT' }) // -> { isPending: false, error: undefined, result: [] }
    reducer({ result, error, ... }, { type: LOAD_USERS.PENDING }) // -> { isPending: true, error, result }
    reducer(anyState, { type: LOAD_USERS.SUCCESS, payload }) // -> { isPending: false, error: undefined, result: payload }
    reducer({ result, ... }, { type: LOAD_USERS.FAILURE, payload }) // -> { isPending: false, error: payload, result }
    ```
- `splitAsyncActionReducer` does the above but separately for multiple keys (when there's a single action used
  for handling multiple entities).
    ```javascript
    const reducer = splitAsyncActionReducer(LOAD_USERS, ({ meta: { search } }) => search)
    reducer(undefined, { type: 'INIT' }) // -> {}
    reducer({ a, ab, abc: { result, error, ... } }, { type: LOAD_USERS.PENDING, meta: { search: 'abc' } })
    // -> { a, ab, abc: { isPending: false, error, result } }
    reducer({ a, ab, abc }, { type: LOAD_USERS.SUCCESS, payload, meta: { search: 'abc' } })
    // -> { a, ab, abc: { isPending: false, error: undefined, result: payload } }
    reducer({ a, ab, abc: { result, ... } }, { type: LOAD_USERS.FAILURE, payload, meta: { search: 'abc' } })
    // -> { a, ab, abc: { isPending: false, error: payload, result } }
    ```

###### flagReducer

`flagReducer` manages a boolean flag derived from lists of "true", "false", and "toggle" types.

```javascript
const reducer = flagReducer([ENTER, SHOW], [HIDE, LEAVE], [TOGGLE])
reducer(undefined, { type: 'INIT' }) // -> false
reducer(anyState, { type: SHOW }) // -> true
reducer(anyState, { type: HIDE }) // -> false
reducer(false, { type: TOGGLE }) // -> true
reducer(true, { type: TOGGLE }) // -> false
```

```javascript
const reducer = flagReducer([ENTER, SHOW], [HIDE, LEAVE], [TOGGLE], true)
reducer(undefined, { type: 'INIT' }) // -> true
// … the rest works just the same
```

###### singleActionReducer

`singleActionReducer` collects data from just a single specific action (or rather message type). Assuming
`const JUMP = defineType('JUMP')`:

```javascript
const reducer = singleActionReducer(JUMP)
reducer(undefined, { type: 'INIT' }) // -> undefined
reducer(undefined, { type: JUMP, payload }) // -> payload
```

```javascript
const reducer = singleActionReducer(JUMP, (state, { payload: { distance } }) => Math.max(state, distance), 0)
reducer(undefined, { type: 'INIT' }) // -> 0
reducer(0, { type: JUMP, payload: { height: 120, distance: 180 } }) // -> 180
reducer(180, { type: JUMP, payload: { height: 134, distance: 161 } }) // -> 180
```

##### Sagas

###### asyncActionSaga

`asyncActionSaga` runs an "async action", emitting appropriate messages along the way.

```javascript
const ENTER = defineType('ENTER')
const LOAD_USERS = defineAsyncType('LOAD_USERS')
const saga = function* () {
  yield takeLatest(ENTER, asyncActionSaga(LOAD_USERS, effect))
}
const trigger = { type: ENTER, ... }
```

Running this saga makes it:

1. emit `{ type: LOAD_USERS.PENDING, meta: { trigger } }`, then
1. call `const result = effect(trigger.payload, state, trigger)` and wait for it to complete or fail, then
1. emit `{ type: LOAD_USERS.SUCCESS, payload: result, meta: { trigger } }` on success or
  `{ type: LOAD_USERS.FAILURE, payload: capturedError, meta: { trigger } }` on failure.

Note that all of the messages contain the message that triggered them in `meta.trigger` by default. This can be
modified/extended by passing `getMeta` in the third options argument.

###### sideEffectsMapSaga

`sideEffectsMapSaga` simplifies invocation of no-return side-effects, e.g. logging, notifications, or auto-persistence.

```javascript
const saga = sideEffectsMapSaga({
  [ENTER]: () => alert('Welcome!'),
  [LOAD_USERS.FAILURE]: error => alert(`Loading users failed! (${error})`),
  [LOAD_USERS.SUCCESS]: (payload, { meta: { page, totalPages } }) => (page < totalPages - 1)
    && alert('Not all of the users were loaded. Scroll to bottom to load more.'),
  [LOAD_USERS.FAILURE]: (error, action, state) => alert(`Failed to load${getUsers(state).length ? ' more' : ''} users`)
})
```

Running this saga makes it fire off the provided side-effects when their respective triggers are observed.

##### Ducks

###### asyncActionDuck & friends

`asyncActionDuck` creates a state manager for an async action.

```javascript
const ENTER = defineType('ENTER')
const {
  TYPE: LOAD_USERS,
  getResult: getUsers,
  getStatus: getLoadUsersStatus
} = duck(asyncActionDuck(ENTER, ::api.fetchUsers))
```

- It defines an async `TYPE`,
- uses `asyncActionSaga` with `takeLatest` to call `effect`, emit the appropriate messages whenever the trigger
  is observed, and discard obsolete results when encountering another trigger while the `effect` is in progress,
- uses `asyncActionReducer` to store status and results and defines selectors for each.

`asyncActionDuckWithTrigger` provides an additional sugar for those (quite common) cases where trigger is defined/used
exclusively to trigger this async action. _That's likely not the case with `ENTER` above (user entering a page is
a nice thing to know globally)._

```javascript
const {
  TRIGGER_TYPE: SUBMIT_USER,
  EFFECT_TYPE: SAVE_USER,
  getResult: getSaveUserResult,
  getStatus: getSaveUserStatus
} = duck(asyncActionDuckWithTrigger(::api.fetchUsers))
```

`splitAsyncActionDuck` helps with the cases where a single async action is used to perform effects for multiple separate
entities. It stores (and obsoletes) data on per-entity basis.

```javascript
const getKey = ({ payload: user }) => user.id
const {
  TYPE: LOAD_USER_COMMENTS,
  getResults: getAllComments, // -> { firstUserId: firstUserComments, ... }
  getStatuses: getAllLoadCommentsStatuses, // -> { firstUserId: { isPending: Boolean, error: * }, ... }
  getResult: getComments, // -> (userId) => commentsForThatUser: *
  getStatus: getLoadCommentsStatus // -> (userId) => statusForThatUser: { isPending: Boolean, error: * }
} = duck(splitAsyncActionDuck(LOAD_USER.SUCCESS, getKey, ::api.fetchComments))
```  

###### confirmDuck

`confirmDuck` helps with adding a confirmation layer over an existing action.

```javascript
const { action: doUpdateUser } = duck(asyncActionDuckWithTrigger(::api.saveUser))
const {
  TRIGGER: UPDATE_USER,
  trigger: updateUser,
  CONFIRM: CONFIRM_USER_UPDATE,
  confirm: confirmUserUpdate,
  CANCEL: CANCEL_USER_UPDATE,
  cancel: cancelUserUpdate,
  isPending: isUserUpdateConfirmationPending,
  getTriggerPayload: getUserUpdateData // useful to e.g. show the user's name in the confirmation dialog
} = duck(confirmDuck(doUpdateUser))
```

Shape of `trigger` and `confirm` payloads can be adjusted by passing additional arguments to `confirmDuck`.

###### flagDuck

`flagDuck` helps manage a simple boolean flag.

```javascript
const {
  TURN_ON_TYPE: SHOW_EDITOR,
  turnOn: showEditor,
  TURN_OFF_TYPE: HIDE_EDITOR,
  turnOff: hideEditor,
  TOGGLE_TYPE: TOGGLE_EDITOR,
  toggle: toggleEditor,
  selector: getIsEditorVisible
} = duck(flagDuck())
```

###### formDuck

`formDuck` manages form state from the initial load, through changes, to the eventual submit (possibly with multiple
load triggers, living through multiple submits, etc.).

_More details TBD…_

`formValidationDuck` is a decorator for adding async validation to `formDuck`.

_More details TBD…_

###### getSetDuck

`getSetDuck` helps deal with those simple cases where an action simply maps to stored state.

```javascript
const {
  TYPE: SET_SEARCH,
  action: setSearch,
  selector: getSearch
} = duck(getSetDuck(''))
```

###### persistenceDuck

`persistenceDuck` is a state manager decorator that initializes the state from external storage and then saves
subsequent state updates to the same.

```javascript
const storage = {
  get: key => JSON.parse(localStorage.getItem(key) ?? 'null') ?? undefined,
  set: (key, value) => (value === undefined) ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value))
}
const pageSize = nest('pageSize')
const { TYPE: SET_PAGE_SIZE } = pageSize.duck(getSetDuck(25)) // use default size of 25…
pageSize.duck(persistenceDuck(storage, SET_PAGE_SIZE)) // …but only if there's none already persisted
```

###### reduceAndSelectDuck

`reduceAndSelectDuck` helps store and access state (at the place in state tree where it is applied, implicitly).

```javascript
const { selector: getMaxObservedPrice } = duck(
  reduceAndSelectDuck(
    singleActionReducer(
      LOAD_PRODUCTS.SUCCESS,
      (prevMaxPrice, { payload: products }) => Math.max(prevMaxPrice, ...products.map(({ price }) => price)),
      0
    )
  )
)
```

## Development

### Install

Install dependencies using:

```sh
npm install
```

### Develop

After you modify sources, run the following (or set up your IDE to do it for you):

- format the code using `npm run format`
- lint it using `npm run lint`
- test it using `npm test`

and fix the errors, if there are any.

### Publish

Publishing is done in two steps:

1. Create a new version tag and push it to the repository:
    ```sh
    npm version <patch|minor|major>
    git push --follow-tags
    ```
1. Build and publish the new version as a npm package:
    ```sh
    npm publish --access public
    ``` 
