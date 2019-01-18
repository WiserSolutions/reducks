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

  it('merges arrays of objects', () => {
    const dynamicState = {
      ...basicState,
      projects: [{ name: { ...fieldBase, value: 'Cool Stuff' } }, { name: { ...fieldBase, value: 'Work' } }]
    }
    const projectUpdate = { touched: true, errors: ['Name not fun enough!'] }
    expect(mergeFormState(dynamicState, { projects: [{}, projectUpdate] })).toEqual(
      updateIn('projects[1]', project => ({ ...project, ...projectUpdate }))(dynamicState)
    )
  })
})
