import React from 'react';
import { Link } from 'gatsby';
import ThemeToggle from './ThemeToggle';

import { rhythm, scale } from '../utils/typography';

const Layout = ({ location, title, children }) => {
    const rootPath = `${__PATH_PREFIX__}/`;
    let header;

    if (location.pathname === rootPath) {
        header = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1
                    style={{
                        ...scale(1.5),
                        marginBottom: rhythm(1.5),
                        marginTop: 0,
                    }}
                >
                    <Link
                        style={{
                            boxShadow: `none`,
                            textDecoration: `none`,
                            color: `var(--text-emphasized)`,
                        }}
                        to="/"
                    >
                        {title}
                    </Link>
                </h1>
                <ThemeToggle />
            </div>
        );
    } else {
        header = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3
                    style={{
                        fontFamily: `Montserrat, sans-serif`,
                        marginTop: 0,
                        marginBottom: 0,
                    }}
                >
                    <Link
                        style={{
                            boxShadow: `none`,
                            textDecoration: `none`,
                            color: `var(--text-emphasized)`,
                        }}
                        to="/"
                    >
                        {title}
                    </Link>
                </h3>
                <ThemeToggle />
            </div>
        );
    }
    return (
        <div
            style={{
                marginLeft: `auto`,
                marginRight: `auto`,
                maxWidth: rhythm(40),
                padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                minHeight: '100vh',
                transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
        >
            <header>{header}</header>
            <main>{children}</main>
            <footer style={{ 
                marginTop: rhythm(2),
                paddingTop: rhythm(1),
                borderTop: `1px solid var(--text-secondary)`,
                color: 'var(--text-secondary)',
                fontSize: '0.9em'
            }}>
                © {new Date().getFullYear()}, Built with
                {` `}
                <a 
                    href="https://www.gatsbyjs.org"
                    style={{ color: 'var(--text-accent)' }}
                >
                    Gatsby
                </a>
            </footer>
        </div>
    );
};

export default Layout;
