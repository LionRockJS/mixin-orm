import { Central } from '@lionrockjs/central';
import config from './config/database.mjs';

Central.initConfig(new Map([
  ['database', config],
]));
