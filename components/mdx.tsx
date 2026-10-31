import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Assurance } from './assurance';
import { Callout } from './callout';
import { FeatureList } from './feature-list';
import { FloeAssurance, FloeFeatures, FloeInstall } from './floe-parts';
import { InstallTabs } from './install-tabs';
import { Mermaid } from './mermaid';
import { Marks } from './product-marks';
import {
  Issue,
  Roadmap,
  RoadmapGroup,
  RoadmapList,
  RoadmapRequests,
  RoadmapUpdated,
} from './roadmap';

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

/**
 * A docs index's links to its pages, as a plain list in two columns: each page's name and a
 * line about it. Fumadocs draws these as a grid of boxes, which beside a sidebar of the same
 * pages is the same list twice, the second time louder.
 */
function Cards({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">{children}</div>;
}

function Card({
  title,
  href,
  children,
}: {
  title: ReactNode;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      <span className="font-medium text-fd-foreground underline-offset-4 group-hover:underline">
        {title}
      </span>
      <span className="text-sm text-fd-muted-foreground text-pretty">{children}</span>
    </>
  );
  return href ? (
    <Link href={href} className="group flex flex-col gap-1">
      {body}
    </Link>
  ) : (
    <div className="flex flex-col gap-1">{body}</div>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Assurance,
    Callout,
    Card,
    Cards,
    FeatureList,
    FloeAssurance,
    FloeFeatures,
    FloeInstall,
    InstallTabs,
    Marks,
    Mermaid,
    Issue,
    Roadmap,
    RoadmapGroup,
    RoadmapList,
    RoadmapRequests,
    RoadmapUpdated,
    img: DocsImage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
