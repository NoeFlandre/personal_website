declare module "remark-collapse" {
  interface CollapseOptions {
    test: string;
    summary?: string | ((heading: string) => string);
  }

  const remarkCollapse: import("unified").Plugin<[CollapseOptions], import("mdast").Root>;
  export default remarkCollapse;
}
