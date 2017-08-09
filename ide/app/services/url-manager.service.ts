import { PlominoTabsManagerService } from './tabs-manager/index';
import { TabsService } from './tabs.service';
import { LogService } from './log.service';
import { Injectable } from '@angular/core';

@Injectable()
export class URLManagerService {

  constructor(
    private log: LogService,
    private tabsManagerService: PlominoTabsManagerService,
  ) { }

  rebuildURL(openedTabs: PlominoTabUnit[]): void {
    const url = openedTabs.map((tab) => tab.url.split('/').pop()).join(',');
    this.setURL(url);
  }

  restoreTabsFromURL(): void {
    const urlItems = this.parseURLString();

    if (urlItems.length) {
      this.tabsManagerService.setOpenedTabActive = false;
      let i = 0;

      for (let urlItem of urlItems) {
        if (++i === urlItems.length) {
          this.tabsManagerService.setOpenedTabActive = true;
        }

        window['materialPromise']
          .then(() => {
            const $resource = $(`.tree-node--name:contains("${ urlItem }")`)
              .filter((i, node: HTMLElement) => $(node).text().trim() === urlItem);

            if (!$resource.length) {
              return;
            }

            const tabData = {
              editor: {
                  'PlominoForm': 'layout', 
                  'PlominoView': 'view'
                }[$resource.attr('data-type')],
              label: $resource.next().text().trim(),
              url: $resource.attr('id').replace('tree_', ''),
              id: urlItem
            }

            this.tabsManagerService.openTab(tabData);
          });
      }
    }
  }

  parseURLString(): string[] {
    const result = window.location.hash.replace('#t=', '').split(',');
    return result.length && Boolean(result[0]) ? result : [];
  }

  private setURL(url: string): void {
    window.location.hash = url ? `#t=${ url }` : '';
  }
}