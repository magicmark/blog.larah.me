/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';

import { rhythm } from '../utils/typography';

const Bio = () => {
    const data = useStaticQuery(graphql`
        query BioQuery {
            site {
                siteMetadata {
                    author
                    social {
                        twitter
                    }
                }
            }
        }
    `);

    const { author, social } = data.site.siteMetadata;
    return (
        <div style={{ display: 'flex' }}>
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginRight: rhythm(1 / 2),
                    flex: '0 0 56px',
                }}
            >
                <StaticImage
                    src="../../content/assets/mark.jpg"
                    alt={author}
                    placeholder="blurred"
                    layout="fixed"
                    width={112}
                    style={{
                        width: '100%',
                        height: '100%',
                        margin: 0,
                    }}
                    imgStyle={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        margin: 0,
                    }}
                />
            </div>

            <p>
                Written by <strong>{author}</strong> who lives and works in Austin, TX. <br />
                <a href={`https://x.com/${social.twitter}`}>Follow me on Twitter!</a>
            </p>
        </div>
    );
};

export default Bio;
