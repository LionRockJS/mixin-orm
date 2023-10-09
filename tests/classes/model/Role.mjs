import { ORM } from '@lionrockjs/central';

export default class Role extends ORM{
  static joinTablePrefix = 'role';
  static tableName = 'roles';

  static fields = new Map([
    ["name", "String"]
  ]);

  static hasMany = [
    ["role_id", "User"]
  ];
}
