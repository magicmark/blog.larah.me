module.exports = {
    siteMetadata: {
        title: `blog.larah.me`,
        author: `Mark Larah`,
        description: `A blog about JavaScript, Node, GrapQL and general web infra dev.`,
        siteUrl: `https://blog.larah.me`,
        social: {
            twitter: `mark_larah`,
        },
    },
    trailingSlash: 'always',
    plugins: [
        'gatsby-plugin-image',
        'gatsby-plugin-meta-redirect',
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: `${__dirname}/content/blog`,
                name: 'blog',
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: `${__dirname}/content/assets`,
                name: 'assets',
            },
        },
        {
            resolve: 'gatsby-transformer-remark',
            options: {
                plugins: [
                    {
                        resolve: 'gatsby-remark-images',
                        options: {
                            maxWidth: 800,
                        },
                    },
                    {
                        resolve: 'gatsby-remark-responsive-iframe',
                        options: {
                            wrapperStyle: 'margin-bottom: 1.0725rem',
                        },
                    },
                    'gatsby-remark-prismjs',
                    'gatsby-remark-copy-linked-files',
                    'gatsby-remark-smartypants',
                    'gatsby-remark-numbered-footnotes',
                ],
            },
        },
        'gatsby-transformer-sharp',
        'gatsby-plugin-sharp',
        {
            resolve: 'gatsby-plugin-google-analytics',
            options: {
                trackingId: 'UA-64692179-3',
            },
        },
        {
            resolve: 'gatsby-plugin-feed',
            options: {
                feeds: [
                    {
                        serialize: ({ query: { site, allMarkdownRemark } }) => {
                            return allMarkdownRemark.nodes.map(node => {
                                return Object.assign({}, node.frontmatter, {
                                    description: node.excerpt,
                                    date: node.frontmatter.date,
                                    url: site.siteMetadata.siteUrl + node.fields.slug,
                                    guid: site.siteMetadata.siteUrl + node.fields.slug,
                                    custom_elements: [{ "content:encoded": node.html }],
                                })
                            })
                        },
                        query: `{
                            allMarkdownRemark(sort: {frontmatter: {date: DESC}}) {
                                nodes {
                                    excerpt
                                    html
                                    fields {
                                        slug
                                    }
                                    frontmatter {
                                        title
                                        date
                                    }
                                }
                            }
                        }`,
                        output: "/rss.xml",
                        title: "blog.larah.me RSS Feed",
                    },
                ],
            },
        },
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: 'blog.larah.me',
                short_name: 'blog.larah.me',
                start_url: '/',
                background_color: '#ffffff',
                theme_color: '#663399',
                display: 'minimal-ui',
                icon: 'content/assets/mark.jpg',
            },
        },
        'gatsby-plugin-offline',
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-plugin-typography',
            options: {
                pathToConfigModule: 'src/utils/typography',
            },
        },
    ],
};
