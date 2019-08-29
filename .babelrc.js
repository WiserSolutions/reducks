const createDefaultConfig = require('@wisersolutions/transpile-js/babel.config')

module.exports = api => {
  const defaultConfig = createDefaultConfig(api)
  return {
    ...defaultConfig,
    presets: [...defaultConfig.presets, '@babel/preset-typescript'],
    plugins: [...defaultConfig.plugins, '@babel/proposal-object-rest-spread']
  }
}
