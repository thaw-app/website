import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <SiteFrame>
      {children}
      <SiteFooter />
    </SiteFrame>
  );
}
