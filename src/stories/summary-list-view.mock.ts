import { SummaryItem } from '../models/SummaryItem';
import { SummaryList } from '../models/SummaryList';

export const SummaryListMocks: SummaryList[] = [
  new SummaryList(
    'l1',
    new Date('2026-09-12T10:15:00Z'),
    'Summarizer configuration',
    ['config', 'onboarding'],
    [
      new SummaryItem('s1', 1, 'How do I configure the summarizer?', 'User asked how to configure the summarizer; pointed at the worker settings.'),
      new SummaryItem('s2', 2, 'Where do the defaults live?', 'Defaults live in the worker environment bindings, overridable per request.'),
    ]
  ),
  new SummaryList(
    'l2',
    new Date('2026-09-18T16:40:00Z'),
    'Layout questions',
    ['css'],
    [
      new SummaryItem('s3', 1, 'Flexbox or grid?', 'Use flexbox when content drives layout in one direction, grid when layout drives placement.'),
    ]
  ),
  new SummaryList(
    'l3',
    new Date('2026-09-24T09:05:00Z'),
    'Empty conversation',
    [],
    []
  ),
];

export const SummaryListScrollTestMocks: SummaryList[] = Array.from({ length: 6 }, (_, listIndex) => {
  const listNumber = listIndex + 1;
  return new SummaryList(
    `scroll-l${listNumber}`,
    new Date('2026-09-30T11:00:00Z'),
    `Scroll test list ${listNumber}`,
    ['scroll'],
    Array.from({ length: 6 }, (_, itemIndex) => {
      const itemNumber = itemIndex + 1;
      return new SummaryItem(
        `scroll-l${listNumber}-s${itemNumber}`,
        itemNumber,
        `${listNumber}.${itemNumber} What causes the summary to repeat?`,
        `${listNumber}.${itemNumber} Repeated summary content used to pad the list for scroll testing.`
      );
    })
  );
});
