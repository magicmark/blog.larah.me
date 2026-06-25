// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.larah.me',
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	redirects: {
		'/asking-for-help-on-slack/': '/blog/asking-for-help-on-slack/',
		'/dont-rethrow-new-Error-error/': '/blog/dont-rethrow-new-error-error/',
		'/mess-directory/': '/blog/mess-directory/',
		'/mocking-with-unionfs-and-jest/': '/blog/mocking-with-unionfs-and-jest/',
		'/never-say-it-didnt-work/': '/blog/never-say-it-didnt-work/',
		'/pop-the-hood/': '/blog/pop-the-hood/',
		'/prefer-having-discussions-in-public/': '/blog/prefer-having-discussions-in-public/',
		'/react-server-side-rendering/': '/blog/react-server-side-rendering/',
		'/teach-to-fish/': '/blog/teach-to-fish/',
		'/upstream-vs-downstream/': '/blog/upstream-vs-downstream/',
		'/write-explicit-type-guards/': '/blog/write-explicit-type-guards/',
		'/write-the-docs-first/': '/blog/write-the-docs-first/',
		// Old blog URL format redirect
		'/2017/04/10/react-server-side-rendering': '/blog/react-server-side-rendering/',
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
