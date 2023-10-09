import { ORM } from '@lionrockjs/central';

export default class ModelParent extends ORM{
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
