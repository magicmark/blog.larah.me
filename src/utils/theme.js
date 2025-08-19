// Solarized color palette
export const solarizedColors = {
  light: {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0: '#839496',
    base1: '#93a1a1',
    base2: '#eee8d5',
    base3: '#fdf6e3',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900',
    // Light mode specific assignments
    background: '#fdf6e3',
    backgroundHighlight: '#eee8d5',
    primary: '#657b83',
    secondary: '#93a1a1',
    emphasized: '#586e75',
    accent: '#268bd2'
  },
  dark: {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0: '#839496',
    base1: '#93a1a1',
    base2: '#eee8d5',
    base3: '#fdf6e3',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900',
    // Dark mode specific assignments
    background: '#002b36',
    backgroundHighlight: '#073642',
    primary: '#839496',
    secondary: '#657b83',
    emphasized: '#93a1a1',
    accent: '#268bd2'
  }
};

export const getTheme = (isDark = false) => {
  return isDark ? solarizedColors.dark : solarizedColors.light;
};
