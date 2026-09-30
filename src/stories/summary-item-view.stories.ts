import type { Meta, StoryObj } from '@aurelia/storybook';
import { SummaryItemView } from '../components/summary-item-view';
import { SummaryItemMock } from './summary-item-view.mock'

const meta: Meta<SummaryItemView> = {
  title: 'Components/SummaryItemView',
  component: SummaryItemView,
};

export default meta;

type Story = StoryObj<SummaryItemView>;

export const Default: Story = {
  args: {
    summary: SummaryItemMock,
  },
};

export const Test: Story = {
  args: {
    summary: {
      "__isClassInstance__": true,
      "__className__": "SummaryItem",
      "id": "s1",
      "order": 1,
      "messageContent": "Test messsage",
      "summaryContent": "User asked about summarizer AFADSFoptions."
    }
  }
};