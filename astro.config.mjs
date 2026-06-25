// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.larah.me',
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	markdown: {
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
	},
	redirects: {
		// Old blog URL format redirect
		'/2017/04/10/react-server-side-rendering': '/react-server-side-rendering/',
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
