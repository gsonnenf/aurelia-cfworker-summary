import { bindable } from 'aurelia';
import { SummaryList } from '../models/SummaryList';

export class SummaryListView {
  @bindable lists: SummaryList[] = [];
  @bindable selected: SummaryList | null = null;

  binding() {
    if (!this.selected && this.lists.length > 0) {
      this.selected = this.lists[0];
    }
  }

  select(list: SummaryList) {
    this.selected = list;
  }
}
