
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
module.exports = withMDX({
  reactStrictMode: true,
  pageExtensions: ['md', 'mdx', 'ts', 'tsx', 'js', 'jsx'],
});
