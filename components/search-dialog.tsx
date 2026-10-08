'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SearchItemType,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { docsRoute } from '@/lib/shared';

// What the panel lists before anything is typed, as Floe opens on its suggestions and
// not on an empty field.
const suggestions: SearchItemType[] = [
  ['Install Thaw', '/'],
  ['Try Thaw in your browser', '/#try'],
  ['Thaw documentation', `${docsRoute}/thaw`],
  ['Frequent issues', `${docsRoute}/thaw/frequent-issues`],
  ['Changelog', `${docsRoute}/thaw/changelog`],
  ['Roadmap', '/roadmap'],
  ['Community', '/community'],
  ['Built with', '/built-with'],
  ['Floe documentation', `${docsRoute}/floe`],
].map(([name, url]) => ({ type: 'page', id: url, content: name, url }));

const client = fetchClient({ api: '/api/search' });

const keyCap =
  'rounded-[5px] bg-black/[0.08] px-1.5 py-0.5 font-sans text-[11px] leading-none font-medium text-black/60 dark:bg-white/[0.12] dark:text-white/60';

/**
 * The site's search, drawn as Floe's launcher: the same panel, field and rows
 * as the one on the demo desktop, here with real results. The site's corners
 * are square everywhere else; this panel keeps Floe's round ones, because it
 * is Floe's.
 */
export function FloeSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({ client });
  const typed = search.length > 0;

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent className="top-[10dvh] max-w-[750px] rounded-[24px] border-black/10 bg-[rgb(244_244_246/0.95)] text-black/85 backdrop-blur-2xl *:border-b-0 md:top-[14dvh] dark:border-white/15 dark:bg-[rgb(30_30_33/0.95)] dark:text-white/90">
        <SearchDialogHeader className="mx-3 mt-3 mb-1 gap-2.5 rounded-[12px] bg-black/[0.05] px-3.5 py-[11px] ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#1560e8] dark:bg-white/[0.07] dark:ring-white/15 dark:focus-within:ring-[#6aa5ff]">
          <SearchDialogIcon className="size-[17px]" />
          <SearchDialogInput
            placeholder="Search the docs…"
            className="text-[17px] leading-[21px]"
          />
        </SearchDialogHeader>
        {!typed && (
          <p className="px-[18px] pt-2.5 pb-1 text-[13px] font-semibold text-black/55 dark:text-white/55">
            Suggestions
          </p>
        )}
        <SearchDialogList
          items={query.data !== 'empty' ? query.data : suggestions}
          className="px-2"
          Item={({ item, onClick }) => (
            <SearchDialogListItem
              item={item}
              onClick={onClick}
              className="rounded-[12px] aria-selected:bg-black/[0.09] aria-selected:text-inherit dark:aria-selected:bg-white/[0.13]"
            />
          )}
        />
        <SearchDialogFooter className="flex items-center justify-end gap-4 bg-transparent px-4 py-2.5 text-[12px] text-black/60 dark:text-white/60">
          <span className="flex items-center gap-1.5 max-sm:hidden">
            Move <kbd className={keyCap}>↑</kbd>
            <kbd className={keyCap}>↓</kbd>
          </span>
          <span className="flex items-center gap-1.5 max-sm:hidden">
            Open <kbd className={keyCap}>↵</kbd>
          </span>
          <SearchDialogClose className="h-auto gap-1.5 border-0 bg-transparent p-0 font-sans text-[12px] text-inherit shadow-none hover:bg-transparent">
            Close <kbd className={keyCap}>esc</kbd>
          </SearchDialogClose>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
