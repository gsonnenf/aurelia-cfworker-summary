import { SummaryItem } from '../models/SummaryItem';
import { SummaryList } from '../models/SummaryList';

/** Roughly 500 words, to exercise wrapping and row height against short neighbours. */
const LongSummaryContent =
  'The team spent most of the session working through how the summarizer should '
  + 'cache intermediate results, and the conversation ranged much further than the '
  + 'original question about response times. The starting complaint was that a '
  + 'second request for the same conversation took almost as long as the first, '
  + 'which suggested that nothing useful was being retained between calls. Tracing '
  + 'a single request showed that the expensive step was not the model call itself '
  + 'but the retrieval and normalisation that happened before it, because every '
  + 'message in the thread was being re-fetched, re-ordered and re-tokenised from '
  + 'scratch each time. That established the shape of the problem: the cache needed '
  + 'to sit in front of the preparation stage rather than in front of the model, '
  + 'which is where everyone had assumed it belonged. From there the discussion '
  + 'split into questions of key design and invalidation. Keying on the '
  + 'conversation identifier alone was rejected quickly, because an edited message '
  + 'would silently serve a stale summary, and the team agreed that a wrong summary '
  + 'presented confidently is considerably worse than a slow one. Keying on a hash '
  + 'of the full message set was correct but defeated the purpose, since computing '
  + 'the hash required the same retrieval the cache was meant to avoid. The '
  + 'compromise was to key on the conversation identifier together with a revision '
  + 'counter that the write path already maintained, so a reader can construct the '
  + 'key cheaply and any mutation moves the counter forward and invalidates the '
  + 'entry as a side effect. Nobody loved depending on the write path for '
  + 'correctness, but the alternatives all required reading the data to decide '
  + 'whether the data needed reading. Storage was less contentious. An in-process '
  + 'map was ruled out because the workers are stateless and scale horizontally, so '
  + 'hit rates would fall off as instances multiplied, and a shared store was '
  + 'preferred for that reason despite the added latency on every lookup. The team '
  + 'sized the entries, found them small enough that eviction pressure was unlikely '
  + 'to matter in the first year, and set a conservative time-to-live anyway on the '
  + 'grounds that an unexplained stale entry is much harder to debug than a cache '
  + 'miss. Metrics were agreed at the same time: hit rate, miss latency and '
  + 'invalidation count, all tagged by conversation size, because the team expected '
  + 'the behaviour of long threads to differ sharply from short ones and wanted the '
  + 'data to show it rather than argue about it later. Two items were explicitly '
  + 'deferred. Warming the cache ahead of a likely request was judged premature '
  + 'without usage data, and partial reuse, where an appended message would let the '
  + 'existing prepared context be extended rather than rebuilt, was acknowledged as '
  + 'the larger win but also as a substantially harder change that should wait until '
  + 'the simple version is measured in production. The session closed with agreement '
  + 'that the first implementation should be deliberately unclever, so the numbers '
  + 'it produces can be trusted as a baseline for whatever replaces it.';

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
  new SummaryList(
    'l4',
    new Date('2026-09-26T14:20:00Z'),
    'Caching strategy',
    ['performance', 'caching'],
    [
      new SummaryItem('s4', 1, 'Why is the second request still slow?', 'Repeat requests were not reusing any prepared context.'),
      new SummaryItem('s5', 2, 'What did the team decide about caching?', LongSummaryContent),
      new SummaryItem('s6', 3, 'What was left for later?', 'Cache warming and partial reuse were both deferred until there is usage data.'),
    ]
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
