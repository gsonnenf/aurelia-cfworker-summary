import { bindable, resolve } from 'aurelia';
import { SummaryList } from '../models/SummaryList';
import { SummaryItem } from '../models/SummaryItem';
import { DisplayType, IDisplayMessage } from '../contracts/ui/IDisplayMessage';




export class SummaryListView {
  @bindable lists: SummaryList[] = [];
  @bindable selected: SummaryList | null = null;

  private readonly messageDisplay = resolve(IDisplayMessage);

  editingList: SummaryList | null = null;
  draftLabel = '';
  labelInput?: HTMLInputElement;

  binding() {
    if (!this.selected && this.lists.length > 0) {
      this.selected = this.lists[0];
    }
  }

  select(list: SummaryList) {
    this.selected = list;
  }

  startEditingLabel(list: SummaryList) {
    this.draftLabel = list.label;
    this.editingList = list;
    setTimeout(() => this.labelInput?.focus(), 0);
  }

  commitEditingLabel() {
    if (this.editingList) {
      this.editingList.label = this.draftLabel;
    }
    this.editingList = null;
  }

  cancelEditingLabel() {
    this.editingList = null;
  }

  deleteSelected() {
    if (!this.selected) {
       this.messageDisplay.displayMessage("No list selected", DisplayType.Warning )
      return;
    }
    const index = this.lists.indexOf(this.selected);
    if (index === -1){
       this.messageDisplay.displayMessage("List not found", DisplayType.Warning );
      return;
    }
    this.lists.splice(index, 1);
    this.selected = this.lists[index] ?? this.lists[index - 1] ?? null;
    this.messageDisplay.displayMessage("List deleted", DisplayType.Success );
  }

  deleteItem(item: SummaryItem) {
    if (!this.selected) return;
    const index = this.selected.summaries.indexOf(item);
    if (index !== -1) {
      this.selected.summaries.splice(index, 1);
    }
  }
}
