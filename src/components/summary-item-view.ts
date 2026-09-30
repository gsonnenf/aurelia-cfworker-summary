import { bindable } from 'aurelia';
import { SummaryItem } from '../models/SummaryItem';
//import '@tabler/icons-webfont/dist/tabler-icons.min.css';

export class SummaryItemView {
  @bindable summary!: SummaryItem;

    // Lifecycle hooks, delete the ones you don't need
  binding() {}
  attached() {}
  detaching() {}
}
