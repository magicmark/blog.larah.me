// @ts-check

import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkImgAttrs from './src/plugins/remark-img-attrs.mjs';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://blog.larah.me',
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	markdown: {
		processor: unified({
			remarkPlugins: [remarkImgAttrs],
			rehypePlugins: [
				rehypeSlug,
				[rehypeAutolinkHeadings, {
					behavior: 'prepend',
					content: {
						type: 'element',
						tagName: 'span',
						properties: { className: ['heading-anchor'], ariaHidden: 'true' },
						children: [{ type: 'text', value: '#' }],
					},
				}],
			],
		}),
	},
	redirects: {
		'/2017/04/10/react-server-side-rendering': '/react-server-side-rendering/',
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Atkinson Hyperlegible',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			weights: [400, 700],
		},
	],
});
