import { Model } from '@lionrockjs/central';

export default class ModelChild extends Model{
  name=null;
  static joinTablePrefix = 'child';
  static tableName = 'children';

  static fields = new Map([
    ["name", "String!"]
  ]);

  static belongsTo = new Map([
    ["parent_id", "ModelParent"],
  ]);
}
