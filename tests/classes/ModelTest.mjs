import { Model } from '@lionrockjs/central';

export default class ModelTest extends Model {
  name=null;

  enabled = true;

  static joinTablePrefix = 'test';

  static tableName = 'tests';

  static fields = new Map([
    ['name', 'String!'],
    ['enabled', 'Boolean!'],
  ]);
}
