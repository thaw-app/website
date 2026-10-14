import { FrameFade } from '@/components/page-fade';
import { SiteBanner } from '@/components/site-banner';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      {/* News about Thaw, so over Thaw's pages and not Floe's. */}
      <SiteBanner />
      <FrameFade>
        <SiteFrame>
          {children}
          <SiteFooter />
        </SiteFrame>
      </FrameFade>
    </>
  );
}
