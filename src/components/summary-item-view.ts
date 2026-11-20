import { bindable } from 'aurelia';
import { SummaryItem } from '../models/SummaryItem';
import { EditableLabel } from './editable-label';
//import '@tabler/icons-webfont/dist/tabler-icons.min.css';

export class SummaryItemView {
  @bindable summary!: SummaryItem;

  /** Set by `view-model.ref` in the template, so the edit button can drive it. */
  contentLabel!: EditableLabel;

    // Lifecycle hooks, delete the ones you don't need
  binding() {}
  attached() {}
  detaching() {}
}
