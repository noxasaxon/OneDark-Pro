import { Colors, ThemeConfiguration, TokenColor } from '../interface'
import data from './themeData'
async function createEditorTokens(config: ThemeConfiguration) {
  // Map editorTheme from config to capitalized version used in data.editorThemes
  let themeName = config.editorTheme;

  if (config.editorTheme === 'oneLightPro') {
    themeName = 'One Light Pro';
  }

  return themeName in data.editorThemes
    ? (await data.editorThemes[themeName]()).default
    : (await data.editorThemes['One Dark Pro']()).default
}
const uniqBy = (arr, fn, set = new Set()) =>
  arr.filter((el) =>
    ((v) => !set.has(v) && set.add(v))(
      typeof fn === 'function' ? fn(el) : el[fn]
    )
  )
function mergeTheme(baseArray, overrides) {
  const mergeArr = [...baseArray, ...overrides]
  const newArr = uniqBy(mergeArr, 'scope')
  overrides.forEach((item) => {
    newArr.forEach((cell) => {
      if (cell.scope === item.scope) {
        cell.settings = {
          ...cell.settings,
          ...item.settings,
        }
      }
    })
  })
  return JSON.parse(JSON.stringify(newArr))
}
function configFactory(configuration) {
  let result: TokenColor[] = JSON.parse(
    JSON.stringify(data.tokenColors.default)
  )

  if (configuration.bold) {
    result = mergeTheme(result, data.tokenColors.bold)
  }
  if (configuration.italic) {
    result = mergeTheme(result, data.tokenColors.italic)
  }

  // Fill in color placeholders with concrete color values
  const colorObj: Colors = configuration.vivid
    ? data.textColors.vivid
    : data.textColors.classic
  for (const key in colorObj) {
    if (configuration[key]) {
      colorObj[key] = configuration[key]
    }
  }

  result.forEach((token) => {
    if (token.settings.foreground) {
      if (token.settings.foreground in colorObj) {
        token.settings.foreground = colorObj[token.settings.foreground]
      }
    }
  })
  return {
    semanticTokenColors: {
      'annotation:dart': {
        foreground: colorObj.whiskey,
      },
      enumMember: {
        foreground: colorObj.fountainBlue,
      },
      macro: {
        foreground: colorObj.whiskey,
      },
      "memberOperatorOverload": {
        foreground: colorObj.purple,
      },
      'parameter.label:dart': {
        foreground: colorObj.lightWhite,
      },
      'property:dart': {
        foreground: colorObj.whiskey,
      },
      tomlArrayKey: {
        foreground: colorObj.chalky,
      },
      'variable:dart': {
        foreground: colorObj.whiskey,
      },
      'variable.constant': {
        foreground: colorObj.whiskey,
      },
      'variable.defaultLibrary': {
        foreground: colorObj.chalky,
      }
    },
    tokenColors: result,
  }
}
export class Theme {
  name = 'One Dark Pro'
  type = 'dark'
  semanticHighlighting = true
  semanticTokenColors
  tokenColors
  colors

  constructor(configuration: ThemeConfiguration) {
    // Set theme type based on config
    if (configuration.editorTheme === 'oneLightPro') {
      this.name = 'One Light Pro'
      this.type = 'light'
    }

    const themeTokens = configFactory(configuration)
    this.semanticTokenColors = themeTokens.semanticTokenColors
    this.tokenColors = themeTokens.tokenColors
    // this.colors = createEditorTokens(configuration)
  }
  static async init(config) {
    const result = {
      ...new Theme(config),
      colors: await createEditorTokens(config),
    }
    return result
  }
}
