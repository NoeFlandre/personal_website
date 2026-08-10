declare module "remark-collapse" {
  interface CollapseOptions {
    test?: string;
    summary?: string;
  }

  const remarkCollapse: (options?: CollapseOptions) => unknown;
  export default remarkCollapse;
}

declare module "@pagefind/default-ui" {
  interface PagefindUIOptions {
    element: string | HTMLElement;
    processTerm?: (term: string) => string;
    showImages?: boolean;
    showSubResults?: boolean;
  }

  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    triggerSearch(term: string): void;
  }
}
