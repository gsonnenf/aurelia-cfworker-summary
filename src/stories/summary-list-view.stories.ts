import type { Meta, StoryObj } from '@aurelia/storybook';
import { SummaryListView } from '../components/summary-list-view';
import { SummaryListMocks } from './summary-list-view.mock';

const meta: Meta<SummaryListView> = {
  title: 'Components/SummaryListView',
  component: SummaryListView,
};

export default meta;

type Story = StoryObj<SummaryListView>;

export const Default: Story = {
  args: {
    lists: SummaryListMocks,
  },
};

export const Empty: Story = {
  args: {
    lists: [],
  },
};
