import { FormsService } from './../../services/forms.service';
import { LogService } from './../../services/log.service';
import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { PlominoBlockPreloaderComponent } from '../../utility';
import { DND_DIRECTIVES } from 'ng2-dnd';
import { treeBuilder } from './tree-builder';

@Component({
  selector: 'plomino-workflow-editor',
  template: require('./workflow.component.html'),
  styles: [require('./workflow.component.css')],
  directives: [DND_DIRECTIVES, PlominoBlockPreloaderComponent],
  encapsulation: ViewEncapsulation.None,
})
export class PlominoWorkflowComponent {
  @ViewChild('workflowEditorNode') workflowEditorNode: ElementRef;
  tree: PlominoWorkflowItem = { children: [] };
  latestTree: PlominoWorkflowItem = null;
  lastId: number = 4;

  constructor(
    private log: LogService,
    private formsService: FormsService,
  ) {
    this.tree = {
      id: 1,
      task: 'Fill in reason to contact',
      form: 'Contact Us',
      user: 'Anon',
      root: true,
      children: [
        {
          id: 2,
          condition: 'View Complaints',
          children: [
            {
              id: 3,
              process: 'Delete',
              user: 'Admin',
              children: []
            },
            {
              id: 4,
              process: 'Reply to user',
              user: 'Admin',
              children: []
            }
          ]
        }
      ]
    };
  }

  ngOnInit() {
    this.buildWFTree();
  }

  findWFItemById(itemId: number, tree = this.tree): PlominoWorkflowItem {
    if (tree.id === itemId) {
      return tree;
    }
    if (tree.children) {
      for (let subTree of tree.children) {
        let result = this.findWFItemById(itemId, subTree);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  /**
   * @param {JQuery} parentItem - closest .workflow-node to the mouse cursor
   */
  dragInsertPreview($parentItem: JQuery, dragData: { title: string, type: string }) {
    if ($parentItem.hasClass('workflow-node--dropping')) {
      return false; // do nothing
    }
    const previewItem: PlominoWorkflowItem = {
      id: -1,
      dropping: true,
      type: dragData.type,
      children: []
    };

    if (dragData.type === 'workflowTask') {
      previewItem.task = 'Empty task';
    }
    else if (dragData.type === 'workflowProcess') {
      previewItem.process = 'Empty process';
    }
    else if (dragData.type === 'workflowCondition') {
      previewItem.condition = 'Empty condition';
    }

    /* copy original tree to temporary sandbox-tree */
    const sandboxTree = jQuery.extend(true, {}, this.tree);

    /* current preview way is just a way to temporary change the tree */
    let parentItem = this.findWFItemById(
      +$parentItem.attr('data-node-id'), sandboxTree
    );
    
    if (parentItem) {
      const parentChildren = jQuery.extend(true, {}, parentItem.children);
      parentItem.children = []; // do children empty

      Object.assign(previewItem.children, parentChildren); // copy with saving link

      parentItem.children.push(previewItem); // make previewItem child of parentItem

      /* compare trees - if they are equal then do nothing */
      if (this.latestTree !== null) {
        const hashA = JSON.stringify(sandboxTree);
        const hashB = JSON.stringify(this.latestTree);
        if (hashA === hashB) {
          this.log.info('equal trees, do nothing');
          return false;
        }
      }
      
      this.buildWFTree(sandboxTree);
    }

    // this.log.info($parentItem, parentItem);
  }

  onDragLeave(dragEvent: { dragData: any, mouseEvent: DragEvent }) {
    const event: DragEvent = dragEvent.mouseEvent;
    const $offset = $(this.workflowEditorNode.nativeElement).offset();

    if (event.clientX < $offset.left || event.clientY < $offset.top) {
      this.buildWFTree();
    }
  }

  onDragEnter(
    dragEvent: {
      dragData: { title: string, type: string },
      mouseEvent: DragEvent
    }
  ) {
    /* at first we need to detect closest node */
    const $target = $(dragEvent.mouseEvent.target);
    let $relatedItem;

    /**
     * cases:
     * 
     * 1. div.workflow-node__view - closest .workflow-node
     * 2. li.plomino-workflow-editor__branch - find .workflow-node:first
     * 3. ul.plomino-workflow-editor__branches - find .workflow-node:first ?
     */

    if (
      $target.hasClass('plomino-workflow-editor__branch')
      || $target.hasClass('plomino-workflow-editor__branches')
    ) {
      $relatedItem = $target.find('.workflow-node:first');
    }
    else if ($target.closest('.workflow-node').length) {
      $relatedItem = $target.closest('.workflow-node');
    }
    else {
      $relatedItem = $(this.workflowEditorNode.nativeElement)
        .find('.workflow-node:last');
    }

    this.dragInsertPreview($relatedItem, dragEvent.dragData);
  }

  generateNewId() {
    this.lastId = this.lastId + 1;
    return this.lastId;
  }

  onDrop(dropEvent: any) {
    const sandboxTree = this.latestTree;
    const temporaryItem = this.findWFItemById(-1, sandboxTree);
    temporaryItem.dropping = false;
    temporaryItem.id = this.generateNewId();
    this.tree = sandboxTree;
    this.buildWFTree();
  }

  unselectAllWFItems() {
    this.workflowEditorNode.nativeElement
      .querySelectorAll('.workflow-node--selected')
      .forEach((selectedNode: HTMLElement) => {
        selectedNode.classList.remove('workflow-node--selected');
      });
  }

  onWFItemClicked($event: JQueryEventObject, $item: JQuery, item: PlominoWorkflowItem) {
    this.log.info($event, $item, item);
    this.unselectAllWFItems();
    $item.find('.workflow-node:first').addClass('workflow-node--selected');
    $event.stopPropagation();

    this.formsService.changePaletteTab(4);

    return true;
  }

  buildWFTree(tree = this.tree) {
    this.latestTree = tree;

    const wfTree: HTMLElement = this.workflowEditorNode.nativeElement;
    
    wfTree.innerHTML = '';
    $(wfTree).append(
      treeBuilder.getBuildedTree(tree, this.onWFItemClicked.bind(this))
    );

    return true;
  }
}
