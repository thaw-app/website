import { headerLinks } from '@/lib/header-links';

/** The header's icons: Thaw's integrations and GitHub, each a link. */
export function HeaderItems() {
  return (
    <div className="flex items-center">
      {headerLinks.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-label={item.label}
          title={item.label}
          className="flex size-9 shrink-0 items-center justify-center text-fd-foreground transition-colors hover:bg-fd-accent active:bg-fd-foreground/15"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
