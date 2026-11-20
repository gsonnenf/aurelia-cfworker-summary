import { SummaryItem } from '../models/SummaryItem';

export const SummaryItemMock: SummaryItem = 
  new SummaryItem('s1', 1, 'This is the message', 'This is the summary.');


  // Dev hook: exposes mocks on the Storybook top frame as `Mock`, so the model
// can be inspected from the console without switching to the preview iframe.
const Mock: Record<string, unknown> = ((window.top ?? window) as unknown as
  { Mock?: Record<string, unknown> }).Mock ??= {};
Mock.SummaryItemMock = SummaryItemMock;
