/**
 * How one of a row of choices looks, chosen or not: the buttons of `Choice`, and links that
 * choose between pages the same way (the changelog's Thaw and Floe).
 */
export function choiceClass(chosen: boolean) {
  return `tap border px-3 py-1.5 text-sm transition-colors ${
    chosen
      ? 'border-fd-foreground bg-fd-foreground text-fd-background'
      : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'
  }`;
}
