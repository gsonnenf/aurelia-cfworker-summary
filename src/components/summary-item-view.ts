import { bindable } from 'aurelia';
import { SummaryItem } from '../models/SummaryItem';
//import '@tabler/icons-webfont/dist/tabler-icons.min.css';

export class SummaryItemView {
  @bindable summary!: SummaryItem;
  @bindable onDelete?: (summary: SummaryItem) => void;
  editing = false;
  draftContent = '';
  draftInput?: HTMLTextAreaElement;

  deleteSelf() {
    this.onDelete?.();
  }

  startEditing() {
    this.draftContent = this.summary.summaryContent;
    this.editing = true;
    setTimeout(() => this.draftInput?.focus(), 0);
  }

  commitEditing() {
    this.summary.summaryContent = this.draftContent;
    this.editing = false;
  }

  cancelEditing() {
    this.editing = false;
  }

    // Lifecycle hooks, delete the ones you don't need
  binding() {}
  attached() {}
  detaching() {}
}
