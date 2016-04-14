import {Component, ViewChild} from 'angular2/core';
import {TreeComponent} from './tree-view/tree.component';
import {MODAL_DIRECTIVES, ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import {TAB_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';

@Component({
    selector: 'my-app',
    templateUrl: 'app/app.component.html',
    styleUrls: ['app/app.component.css'],
    directives: [TreeComponent, MODAL_DIRECTIVES, TAB_DIRECTIVES]
})
export class AppComponent {
    @ViewChild('modal')
    modal: ModalComponent;

    tabs: Array<any> = [];
    newName: string;

    onAdd(event:string){
        this.newName = event;
        this.modal.open();
    }
    onModalClose(){
        this.tabs.push({title:this.newName,content:'I am the content of '+this.newName});
    }
    onTabClose(tab:any){
        this.tabs.splice(this.tabs.indexOf(tab), 1);
    }
    showtabs(){
        console.table(this.tabs);
    }
}