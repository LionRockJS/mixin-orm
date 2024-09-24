import { Central } from '@lionrockjs/central';
import config from './config/database.mjs';
import config_orm from './config/orm.mjs';

await Central.initConfig(new Map([
  ['database', config],
  ['orm', config_orm],
]));
