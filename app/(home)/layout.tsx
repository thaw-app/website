import { PapelStrip } from '@/components/papel-strip';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';
import { SiteNews } from '@/components/site-news';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteNews />
      <PapelStrip />
      <SiteFrame>
        {children}
        <SiteFooter />
      </SiteFrame>
    </>
  );
}
