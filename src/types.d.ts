declare module "remark-collapse" {
  interface CollapseOptions {
    test: string;
    summary?: string | ((heading: string) => string);
  }

  const remarkCollapse: import("unified").Plugin<[CollapseOptions], import("mdast").Root>;
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
