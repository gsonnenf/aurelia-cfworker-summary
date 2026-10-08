import type { Meta, StoryObj } from '@aurelia/storybook';
import { Registration } from 'aurelia';
import { SummaryListView } from '../components/summary-list-view';
import { SummaryListMocks, SummaryListScrollTestMocks } from './summary-list-view.mock';
import { IDisplayMessage } from '../contracts/ui/IDisplayMessage';


const meta: Meta<SummaryListView> = {
  title: 'Components/SummaryListView',
  component: SummaryListView,
  // parameters: {
  //   aurelia: {
  //     register: [Registration.singleton(IDisplayMessage, DisplayMessageNoop)],
  //   },
  // },
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

export const ScrollTest: Story = {
  args: {
    lists: SummaryListScrollTestMocks,
  },
};
