import React from 'react';
import { useTheme } from '../utils/themeContext';

const LightButton = () => (
    <div style={{ display: 'flex', gap: '0.6em' }}>
        <span>☀️</span><span>Light</span>
    </div>
)

const DarkButton = () => (
    <div style={{ display: 'flex', gap: '0.6em'  }}>
        <span>🌙</span><span>Dark</span>
    </div>
)

const ThemeToggle = () => {
    const buttonRef = React.useRef();
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            ref={buttonRef}
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: '2px solid var(--text-accent)',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer',
                color: 'var(--text-accent)',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                marginLeft: '16px',
            }}
            onMouseOver={(e) => {
                buttonRef.current.style.backgroundColor = 'var(--text-accent)';
                buttonRef.current.style.color = 'var(--bg-primary)';
            }}
            onMouseOut={(e) => {
                buttonRef.current.style.backgroundColor = 'transparent';
                buttonRef.current.style.color = 'var(--text-accent)';
            }}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? <LightButton />: <DarkButton />}
        </button>
    );
};

export default ThemeToggle;
