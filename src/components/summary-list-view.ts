import { bindable, resolve } from 'aurelia';
import { SummaryList } from '../models/SummaryList';
import { SummaryItem } from '../models/SummaryItem';
import { DisplayType, IUiMessageDisplay } from '../contracts/ui/IDisplayMessage';


export class SummaryListView {
  @bindable lists: SummaryList[] = [];
  @bindable selected: SummaryList | null = null;

  /**
   * The selected summaries of the selected list, in click order. Multi-select
   * is additive on ctrl-click (cmd on macOS); a plain click replaces it.
   *
   * Always reassigned rather than mutated, so the bindable notifies and the
   * template's `includes` re-evaluates without relying on array observation.
   */
  @bindable selectedItems: SummaryItem[] = [];

  private readonly messageDisplay = resolve(IUiMessageDisplay);

  binding() {
    if (!this.selected && this.lists.length > 0) {
      this.selected = this.lists[0];
    }
  }

  select(list: SummaryList) {
    this.selected = list;
  }

  /** Switching lists drops the item selection; the items are gone from view. */
  selectedChanged() {
    this.selectedItems = [];
  }

  selectItem(item: SummaryItem, event?: MouseEvent) {
    // metaKey as well as ctrlKey: cmd is the additive modifier on macOS.
    const additive = event?.ctrlKey === true || event?.metaKey === true;
    if (!additive) {
      this.selectedItems = [item];
      return;
    }
    this.selectedItems = this.selectedItems.includes(item)
      ? this.selectedItems.filter(selectedItem => selectedItem !== item)
      : [...this.selectedItems, item];
  }

  async deleteSelected() {
    if (!this.selected) {
       this.messageDisplay.displayMessage("No list selected", DisplayType.Warning )
      return;
    }
    const index = this.lists.indexOf(this.selected);
    if (index === -1){
       this.messageDisplay.displayMessage("List not found", DisplayType.Warning );
      return;
    }
    const confirmed = await this.messageDisplay.confirmMessage(
      {
        messageText: `Delete "${this.selected.label}"?`,
        confirmText: 'Delete',
      },
      true,
      this
    );
    if (!confirmed) return;
    this.lists.splice(index, 1);
    this.selected = this.lists[index] ?? this.lists[index - 1] ?? null;
    this.messageDisplay.displayMessage("List deleted", DisplayType.Success );
  }

  async deleteSelectedItems() {
    if (!this.selected) {
      this.messageDisplay.displayMessage("No list selected", DisplayType.Warning );
      return;
    }
    if (this.selectedItems.length === 0) {
      this.messageDisplay.displayMessage("No summaries selected", DisplayType.Warning );
      return;
    }
    // Captured before the await: the confirmation yields, so neither
    // `this.selected` nor `this.selectedItems` is guaranteed to still describe
    // the list these items came from.
    const summaries = this.selected.summaries;
    const items = this.selectedItems;
    const confirmed = await this.messageDisplay.confirmMessage(
      {
        messageText: items.length === 1
          ? 'Delete this summary item?'
          : `Delete ${items.length} summary items?`,
        confirmText: 'Delete',
      },
      true,
      this
    );
    if (!confirmed) return;
    // Bottom-up: removing an index shifts every later one down, so the
    // indices still pending are all below the one being spliced out. Splicing
    // one entry at a time keeps the mutations scoped to the deleted items,
    // where replacing the whole array would report every survivor as changed.
    const indices = items
      .map(item => summaries.indexOf(item))
      .filter(index => index !== -1)
      .sort((a, b) => b - a);
    for (const index of indices) {
      summaries.splice(index, 1);
    }
    this.selectedItems = [];
    this.messageDisplay.displayMessage(
      indices.length === 1 ? "Item deleted" : `${indices.length} items deleted`,
      DisplayType.Success
    );
  }
}
