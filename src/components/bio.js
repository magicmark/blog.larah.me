/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import Image from 'gatsby-image';

import { rhythm } from '../utils/typography';

const Bio = () => {
    const data = useStaticQuery(graphql`
        query BioQuery {
            avatar: file(absolutePath: { regex: "/mark.jpg/" }) {
                childImageSharp {
                    fixed(width: 50, height: 50) {
                        ...GatsbyImageSharpFixed
                    }
                }
            }
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
        <div
            style={{
                display: `flex`,
                marginBottom: rhythm(2.5),
            }}
        >
            <Image
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                style={{
                    marginRight: rhythm(1 / 2),
                    marginBottom: 0,
                    minWidth: 50,
                    borderRadius: `100%`,
                }}
                imgStyle={{
                    borderRadius: `50%`,
                }}
            />
            <p>
                Written by <strong>{author}</strong> who lives and works in Austin, TX
                building occasionally useful things.
                {` `}
                <a href={`https://x.com/${social.twitter}`}>
                    You should follow him on Twitter!
                </a>
            </p>
        </div>
    );
};

export default Bio;
