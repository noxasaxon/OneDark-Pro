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
  let colorObj: Colors;

  if (configuration.editorTheme === 'oneLightPro') {
    // Use the light vibrant colors for One Light Pro
    colorObj = data.textColors.lightVibrant;

    // Special case for light theme - enhance comments visibility
    result.forEach(token => {
      // Make comments more visible in light theme
      if (token.scope &&
        (token.scope.includes('comment') ||
          (Array.isArray(token.scope) && token.scope.some(s => s.includes('comment'))))) {
        token.settings.foreground = '#6d6d6d'; // More visible comment color for light theme
      }

      // Make docstrings more visible in light theme
      if (token.scope &&
        (token.scope.includes('string.quoted.docstring') ||
          (Array.isArray(token.scope) && token.scope.some(s => s.includes('string.quoted.docstring'))))) {
        token.settings.foreground = '#23974a'; // Vibrant green for docstrings
      }

      // Enhance Python-specific syntax
      if (token.scope) {
        const scope = Array.isArray(token.scope) ? token.scope : [token.scope];

        // Make Python function names more vibrant
        if (scope.some(s => s.includes('entity.name.function.python'))) {
          token.settings.foreground = '#2374e9'; // Vibrant blue for function names
        }

        // Make Python decorators more vibrant
        if (scope.some(s => s.includes('meta.decorator.python'))) {
          token.settings.foreground = '#a237c1'; // Vibrant purple for decorators
        }

        // Make Python keywords more vibrant
        if (scope.some(s => s.includes('keyword.control.flow.python') ||
          s.includes('storage.type.function.python') ||
          s.includes('keyword.other.python'))) {
          token.settings.foreground = '#a237c1'; // Vibrant purple for keywords
        }

        // Make string literals more vibrant
        if (scope.some(s => s.includes('string.quoted') && !s.includes('docstring'))) {
          token.settings.foreground = '#23974a'; // Vibrant green for strings
        }

        // Make Python builtin functions more vibrant
        if (scope.some(s => s.includes('support.function.builtin.python'))) {
          token.settings.foreground = '#2374e9'; // Vibrant blue for builtin functions
        }

        // Make self/cls parameters more vibrant 
        if (scope.some(s => s.includes('variable.parameter.function.language.special.self.python') ||
          s.includes('variable.parameter.function.language.special.cls.python'))) {
          token.settings.foreground = '#e2b93d'; // Vibrant yellow for self/cls
        }

        // Make variable types more vibrant
        if (scope.some(s => s.includes('support.type.python'))) {
          token.settings.foreground = '#e2b93d'; // Vibrant yellow for types
        }
      }
    });
  } else {
    // Use existing logic for dark themes
    colorObj = configuration.vivid
      ? data.textColors.vivid
      : data.textColors.classic;
  }

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
