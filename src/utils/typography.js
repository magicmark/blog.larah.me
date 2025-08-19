import Typography from 'typography';

const solarizedTheme = {
  title: 'Solarized',
  baseFontSize: '15px',
  baseLineHeight: 1.666,
  headerFontFamily: ['Montserrat', 'system-ui', 'sans-serif'],
  bodyFontFamily: ['Merriweather', 'Georgia', 'serif'],
  headerColor: 'var(--text-emphasized)',
  bodyColor: 'var(--text-primary)',
  headerWeight: 600,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options, styles) => {
    return {
      'a': {
        color: 'var(--text-accent)',
        textDecoration: 'none',
      },
      'a:hover,a:active': {
        textDecoration: 'underline',
      },
      'blockquote': {
        borderLeft: `4px solid var(--text-accent)`,
        color: 'var(--text-secondary)',
        paddingLeft: rhythm(13/16),
        marginLeft: 0,
        fontStyle: 'italic',
      },
      'pre': {
        backgroundColor: 'var(--bg-highlight)',
        borderRadius: '4px',
        padding: rhythm(1/2),
        overflow: 'auto',
      },
      'code': {
        backgroundColor: 'var(--bg-highlight)',
        borderRadius: '2px',
        padding: '2px 4px',
        fontSize: '85%',
      },
      'pre code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
      'li': {
        marginBottom: rhythm(1/4),
      },
      'hr': {
        background: 'var(--text-secondary)',
        height: '1px',
        border: 'none',
      }
    }
  }
};

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
    // typography.injectStyles();
}

const typography = new Typography(solarizedTheme);
export default typography;
export const rhythm = typography.rhythm;
export const scale = typography.scale;
