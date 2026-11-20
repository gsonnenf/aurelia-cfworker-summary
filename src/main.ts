import Aurelia, { Registration } from 'aurelia';
import { AureliaHeadlessConfiguration } from '@aurelia-ui-toolkits/headless';
import { MyApp } from './my-app';
import { IUiMessageDisplay } from './contracts/ui/IDisplayMessage';
import { DisplayMessageSw } from './services/ui/DisplayMessageSw';

Aurelia
  .register(AureliaHeadlessConfiguration)
  .register(Registration.singleton(IUiMessageDisplay, DisplayMessageSw))
  .app(MyApp)
  .start();
