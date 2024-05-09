import { Model } from '@lionrockjs/central';

export default class Person extends Model{
  first_name = null;
  last_name = null;
  phone = null;
  email = null;

  static joinTablePrefix = 'person';
  static tableName = 'persons';

  static fields = new Map([
    ["first_name", "String!"],
    ["last_name", "String!"],
    ["phone", "String"],
    ["email", "String"]
  ]);

  static hasMany = [
    ["person_id", "User"]
  ];

  static belongsToMany = new Set(["Tag"])
}
