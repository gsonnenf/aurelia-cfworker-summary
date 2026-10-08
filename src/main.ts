import Aurelia, { Registration } from 'aurelia';
import { MyApp } from './my-app';
import { IDisplayMessage } from './contracts/ui/IDisplayMessage';
import { DisplayMessageSw } from './services/ui/DisplayMessageSw';

Aurelia
  .register(Registration.singleton(IDisplayMessage, DisplayMessageSw))
  .app(MyApp)
  .start();
