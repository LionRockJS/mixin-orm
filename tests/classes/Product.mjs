import { ORM } from '@lionrockjs/central';

export default class Product extends ORM{
  name=null;

  static joinTablePrefix = 'product';
  static tableName = 'products';

  static fields = new Map([
    ["name", "String"],
  ]);

  static belongsToMany = new Set([
    "Media"
  ]);
}
