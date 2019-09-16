import Typography from 'typography';
import theme from 'typography-theme-github';


// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
    // typography.injectStyles();
}

theme.overrideThemeStyles = ({ rhythm }, options) => ({
  'li': {
    marginBottom: 0,
  }
})

const typography = new Typography(theme);
export default typography;
export const rhythm = typography.rhythm;
export const scale = typography.scale;
