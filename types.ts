
export interface HierarchyNode {
  name: string;
  value?: string | number | boolean | null;
  children?: HierarchyNode[];
}
