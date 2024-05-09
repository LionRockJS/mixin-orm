import { Model } from '@lionrockjs/central';

export default class ModelParent extends Model{
  name=null;
  static joinTablePrefix = 'parent';
  static tableName = 'parents';

  static fields = new Map([
    ["name", "String!"]
  ]);

  static hasMany = [
    ["child_id", "ModelChild"]
  ];
}
