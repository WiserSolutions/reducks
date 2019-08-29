import { setIn, updateIn } from '@hon2a/icepick-fp'

import { mergeFormState } from './formDuck'

const fieldBase = {
  touched: false,
  dirty: false,
  validating: false,
  errors: undefined
}
const basicState = {
  name: {
    ...fieldBase,
    value: 'Xenon',
    errors: ['Pick a better name!']
  }
}

describe('mergeFormState', () => {
  it('merges form state changes into state', () => {
    expect(mergeFormState(basicState, { name: { touched: true } })).toEqual(setIn('name.touched', true)(basicState))
  })

  it('updates fields even when passed `undefined`', () => {
    expect(mergeFormState(basicState, { name: { errors: undefined } })).toEqual(
      setIn('name.errors', undefined)(basicState)
    )
  })

  it('merges arrays of objects, recursively', () => {
    const dynamicState = {
      ...basicState,
      projects: [
        { name: { ...fieldBase, value: 'Cool Stuff' } },
        {
          name: {
            ...fieldBase,
            value: 'Work',
            errors: [
              { message: 'Fatal error!', severity: 'fatal' },
              { message: 'Another error!', severity: 'error' },
              { message: 'Rabbits have rabbited!', severity: 'funny' }
            ]
          }
        }
      ]
    }
    const nameUpdate = { touched: true, errors: [undefined, { message: 'Name not fun enough!' }, {}] }
    expect(mergeFormState(dynamicState, { projects: [{}, { name: nameUpdate }] })).toEqual(
      updateIn('projects[1].name', name => ({
        ...name,
        touched: true,
        errors: updateIn([1], error => ({ ...error, ...nameUpdate.errors[1] }))(dynamicState.projects[1].name.errors)
      }))(dynamicState)
    )
  })
})
