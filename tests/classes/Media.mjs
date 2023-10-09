import { ORM } from '@lionrockjs/central';

export default class Media extends ORM{
  url=null;
  static joinTablePrefix = 'media';
  static tableName = 'media';

  static fields = new Map([
    ["url", "String!"],
  ]);
}
