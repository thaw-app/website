import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { Assurance } from './assurance';
import { FeatureList } from './feature-list';
import { InstallTabs } from './install-tabs';
import { Mermaid } from './mermaid';
import { Issue, Roadmap, RoadmapGroup, RoadmapList } from './roadmap';

/**
 * The synced docs embed images from GitHub and other hosts. Those go out as
 * plain images: next/image refuses a host it has not been told about, and the
 * docs can link to any.
 */
function DocsImage(props: ComponentProps<'img'>) {
  if (typeof props.src === 'string' && /^https?:/.test(props.src)) {
    // biome-ignore lint/performance/noImgElement: see above
    return <img loading="lazy" {...props} alt={props.alt ?? ''} className="rounded-lg" />;
  }
  const Local = defaultMdxComponents.img;
  return <Local {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Assurance,
    FeatureList,
    InstallTabs,
    Mermaid,
    Issue,
    Roadmap,
    RoadmapGroup,
    RoadmapList,
    img: DocsImage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
