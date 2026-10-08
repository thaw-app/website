// A page that draws an MDX file directly, as /roadmap does, imports it as a component.
declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types';
  import type { ReactElement } from 'react';

  export default function MDXContent(props: MDXProps): ReactElement;
}
