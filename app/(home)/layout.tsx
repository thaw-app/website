import { PapelStrip } from '@/components/papel-strip';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <PapelStrip />
      <SiteFrame>
        {children}
        <SiteFooter />
      </SiteFrame>
    </>
  );
}
