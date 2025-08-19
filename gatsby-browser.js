// custom typefaces
import 'typeface-montserrat';
import 'typeface-merriweather';
import 'prism-themes/themes/prism-duotone-light.css';

// Global theme styles
import './src/styles/global.css';

// Theme Provider
import React from 'react';
import { ThemeProvider } from './src/utils/themeContext';

export const wrapRootElement = ({ element }) => (
  <ThemeProvider>{element}</ThemeProvider>
);
