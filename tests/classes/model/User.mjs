import { ORM } from '@lionrockjs/central';

export default class User extends ORM{
  person_id=null;
  supervisor_id=null;
  role_id=null;
  username=null;
  password=null;

  static joinTablePrefix = 'user';
  static tableName = 'users';

  static fields = new Map([
    ["username", "String!"],
    ["password", "String!"]
  ]);

  static belongsTo = new Map([
    ["person_id", "Person"],
    ["supervisor_id", "Person"],
    ["role_id", "Role"]
  ]);
}
