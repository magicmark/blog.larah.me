import { visit } from 'unist-util-visit';

const STYLE_ATTRS = new Set(['height', 'width', 'max-height', 'max-width', 'min-height', 'min-width']);

export default function remarkImgAttrs() {
	return (tree) => {
		visit(tree, 'paragraph', (node, index, parent) => {
			if (!parent || node.children.length !== 1 || node.children[0].type !== 'text') return;
			const text = node.children[0].value;
			if (!text.startsWith('![')) return;

			const altEnd = text.indexOf('](');
			if (altEnd === -1) return;
			const alt = text.slice(2, altEnd);

			const inside = text.slice(altEnd + 2, -1);
			if (!inside || !text.endsWith(')')) return;

			const parts = inside.split(' ');
			const url = parts[0];
			const attrs = {};
			let style = '';

			let center = false;
			for (const part of parts.slice(1)) {
				if (part === 'center') { center = true; continue; }
				const eq = part.indexOf('=');
				if (eq === -1) continue;
				const key = part.slice(0, eq);
				const value = part.slice(eq + 1);
				if (STYLE_ATTRS.has(key)) {
					style += `${key}: ${/^\d+$/.test(value) ? value + 'px' : value}; `;
				} else {
					attrs[key] = value;
				}
			}
			if (center) style += 'display: block; margin-inline: auto; ';
			if (style) attrs.style = style.trim();

			parent.children[index] = {
				type: 'image',
				url,
				alt: alt || null,
				data: { hProperties: attrs },
			};
		});
	};
}
