import React from 'react';
import { Link, graphql } from 'gatsby';

import Bio from '../components/bio';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { rhythm, scale } from '../utils/typography';

class BlogPostTemplate extends React.Component {
    render() {
        const post = this.props.data.markdownRemark;
        const siteTitle = this.props.data.site.siteMetadata.title;
        const { previous, next, slug } = this.props.pageContext;

        const discussUrl = `https://mobile.twitter.com/search?q=${encodeURIComponent(
            `https://blog.larah.me${slug}`,
        )}`;

        const editUrl = `https://github.com/magicmark/blog.larah.me/edit/master/content/blog/${slug.slice(
            1,
            slug.length - 1,
        )}/index.md`;

        return (
            <Layout location={this.props.location} title={siteTitle}>
                <SEO
                    title={post.frontmatter.title}
                    description={post.frontmatter.description || post.excerpt}
                />
                <article>
                    <header>
                        <h1
                            style={{
                                marginTop: rhythm(1),
                                marginBottom: 0,
                            }}
                        >
                            {post.frontmatter.title}
                        </h1>
                        <p
                            style={{
                                ...scale(-1 / 5),
                                display: `block`,
                                marginBottom: rhythm(1),
                            }}
                        >
                            {post.frontmatter.date}
                        </p>
                    </header>
                    <section dangerouslySetInnerHTML={{ __html: post.html }} />
                    <p>
                        <a
                            href={discussUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Discuss on Twitter
                        </a>
                        {` • `}
                        <a
                            href={editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Edit on GitHub
                        </a>
                    </p>
                    <hr
                        style={{
                            marginBottom: rhythm(1),
                        }}
                    />
                    <footer>
                        <Bio />
                    </footer>
                </article>

                <nav>
                    <ul
                        style={{
                            display: `flex`,
                            flexWrap: `wrap`,
                            justifyContent: `space-between`,
                            listStyle: `none`,
                            padding: 0,
                        }}
                    >
                        <li>
                            {previous && (
                                <Link to={previous.fields.slug} rel="prev">
                                    ← {previous.frontmatter.title}
                                </Link>
                            )}
                        </li>
                        <li>
                            {next && (
                                <Link to={next.fields.slug} rel="next">
                                    {next.frontmatter.title} →
                                </Link>
                            )}
                        </li>
                    </ul>
                </nav>
            </Layout>
        );
    }
}

export default BlogPostTemplate;

export const pageQuery = graphql`
    query BlogPostBySlug($slug: String!) {
        site {
            siteMetadata {
                title
                author
            }
        }
        markdownRemark(fields: { slug: { eq: $slug } }) {
            id
            excerpt(pruneLength: 160)
            html
            frontmatter {
                title
                date(formatString: "MMMM DD, YYYY")
                description
            }
            fields {
                slug
            }
        }
    }
`;
