import { Model } from '@lionrockjs/central';

export default class Media extends Model{
  url=null;
  static joinTablePrefix = 'media';
  static tableName = 'media';

  static fields = new Map([
    ["url", "String!"],
  ]);
}
