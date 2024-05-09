import { Model } from '@lionrockjs/central';

export default class Role extends Model{
  static joinTablePrefix = 'role';
  static tableName = 'roles';

  static fields = new Map([
    ["name", "String"]
  ]);

  static hasMany = [
    ["role_id", "User"]
  ];
}
