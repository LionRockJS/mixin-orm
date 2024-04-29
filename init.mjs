import { Central } from '@lionrockjs/central';
import config from './config/database.mjs';

await Central.initConfig(new Map([
  ['database', config],
]));
