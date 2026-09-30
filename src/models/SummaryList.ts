import { SummaryItem } from './SummaryItem';

export class SummaryList {
  constructor(
    public id: string,
    public timestamp: Date,
    public label: string,
    public tags: string[] = [],
    public summaries: SummaryItem[] = []
  ) {}
}
