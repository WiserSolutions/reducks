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

```ecmascript 6
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

```ecmascript 6
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

```ecmascript 6
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

```ecmascript 6
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

```ecmascript 6
const ADD_TODO = defineType('ADD_TODO') // 'ADD_TODO'
const DO_SOMETHING_ELSE = defineType('ADD_TODO') // error (conflict)
```

###### defineAsyncType

```ecmascript 6
const SAVE_TODOS = defineAsyncType('SAVE_TODOS') // { PENDING: 'SAVE_TODOS.PENDING', SUCCESS: '...', FAILURE: '...' }
const DO_SOMETHING_ELSE = defineType('SAVE_TODOS.SUCCESS') // error (conflict)
```

##### Actions

###### createAction

```ecmascript 6
const addTodo = createAction(ADD_TODO, label => ({ label })) // { type: ADD_TODO, payload: { label } }
```

##### Reducers

###### composeReducers

```ecmascript 6
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

```ecmascript 6
const reducer = combineReducers({
  todos: (state = [], { type, payload }) => (type === ADD_TODO) ? [...state, payload] : state,
  todoLastAddedAt: (state, { type, payload }) => (type === ADD_TODO) ? Date.now() : state
})
reducer({}, { type: ADD_TODO, payload: { label: 'Sleep' } })
// { todos: [{ label: 'Sleep' }], todoLastAddedAt: /* previous line execution timestamp */ }
```

##### Selectors

###### combineSelectors

```ecmascript 6
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

```ecmascript 6
const {
  // verbose API
  defineType,
  defineAsyncType,
  createAction,
  createReducer,
  createSelector,
  createNestedFactory,
  createDuck,
  
  // terse API
  type,
  asyncType,
  action,
  reducer,
  selector,
  nest,
  duck
} = createDuckFactory('some.path')
defineType('ADD') // or type('ADD') -> 'some.path.ADD'
defineAsyncType('SAVE') // or asyncType('SAVE') -> { PENDING: 'some.path.SAVE', SUCCESS: ..., FAILURE: ... }
createAction(ADD, createPayload, createMeta) // or action(...) -> message creator function
createReducer(reduce) // or reducer(...) -> `reduce` is passed just the bit of state at `some.path`
createSelector(select) // or selector(...) -> `select` is passed just the bit of state at `some.path`
createNestedFactory('sub.path') // or nest(...) -> createDuckFactory('some.path.sub.path')
createDuck(genericDuck) // or duck(...) -> feeds itself to generic duck (function that expects a duck factory argument)
```

#### Generics

TBD

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
