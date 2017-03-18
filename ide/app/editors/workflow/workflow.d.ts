interface PlominoWorkflowItem {
  id?: number;
  task?: string;
  form?: string;
  user?: string;
  process?: string;
  condition?: string;
  view?: string;
  goto?: string;
  type?: string;

  /**
   * root means that this item is top element
   */
  root?: boolean;

  /**
   * dropping means that it is preview div with opacity
   */
  dropping?: boolean;

  children: PlominoWorkflowItem[];
}
