import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { Controller } from '@lionrockjs/mvc';
import { Central, ORM, Model, ControllerMixinDatabase } from '@lionrockjs/central';
import { ORMAdapterSQLite } from '@lionrockjs/adapter-database-better-sqlite3';

import ControllerMixinORMInput from '../classes/controller-mixin/ORMInput';
import ControllerMixinORMWrite from '../classes/controller-mixin/ORMWrite';

import Person from './classes/model/Person.mjs';
import User from './classes/model/User.mjs';
import Product from './classes/Product.mjs';
import Media from './classes/Media.mjs';
import ModelTest from './classes/ModelTest.mjs';
import ModelChild from './classes/ModelChild.mjs';

Central.classPath.set('model/ModelChild.mjs', path.normalize(`${__dirname}/classes/ModelChild.mjs`));
Central.classPath.set('model/ModelParent.mjs', path.normalize(`${__dirname}/classes/ModelParent.mjs`));
Central.classPath.set('helper/Form.mjs', path.normalize(`${__dirname}/../classes/helper/Form.mjs`));

Central.classPath.set('model/Product.mjs', Product);
Central.classPath.set('model/Media.mjs', Media);
Central.classPath.set('model/Person.mjs', Person);
Central.classPath.set('model/ModelTest.mjs', ModelTest);
Central.classPath.set('model/User.mjs', User);
Central.classPath.set('model/ModelChild.mjs', ModelChild);
Model.defaultAdapter = ORMAdapterSQLite;

class ControllerTest extends Controller {
  static mixins = [ControllerMixinDatabase, ControllerMixinORMWrite];

  constructor(request, input, Model, db) {
    super(request, new Map([
      [ControllerMixinORMWrite.DATABASE_KEY, 'admin'],
      [ControllerMixinORMInput.ORM_INPUT, input],
    ]));

    this.state.set('orm_model', Model);

    this.sql = [];
    this.queries = [];

    this.database = {
      prepare: sql => {
        const statement = db.prepare(sql);
        this.sql.push(sql);
        return {
          run: (...x) => {
            this.queries.push(x);
            return statement.run(...x);
          },
          get: (...x) => {
            this.queries.push(x);
            return statement.get(...x);
          },
          all: (...x) => {
            this.queries.push(x);
            return statement.all(...x);
          },
        };
      },
    };

    this.state.get(ControllerMixinDatabase.DATABASES).set('admin', this.database);
  }

  async action_index() {
    this.state.set(Controller.STATE_BODY, 'index');
  }

  async action_update() {
    this.state.set(Controller.STATE_BODY, {
      sql: this.sql,
      queries: this.queries,
      instance: this.state.get('instance'),
    });
  }
}

const db = (() => {
  // make blank database
  const targetPath = path.normalize(`${__dirname}/db/empty.sqlite`);
  const sourcePath = path.normalize(`${__dirname}/db/empty.default.sqlite`);
  if (fs.existsSync(targetPath))fs.unlinkSync(targetPath);

  fs.copyFileSync(sourcePath, targetPath);
  const database = new Database(targetPath);

  database.exec(`CREATE TABLE tests(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT, 
enabled BOOL DEFAULT TRUE
); 

CREATE TRIGGER tests_updated_at AFTER UPDATE ON tests WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE tests SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE persons(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
first_name TEXT,
last_name TEXT,
phone TEXT,
email TEXT);

CREATE TRIGGER persons_updated_at AFTER UPDATE ON persons WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE persons SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE roles(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT);

CREATE TRIGGER roles_updated_at AFTER UPDATE ON roles WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE users(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
username TEXT,
password TEXT,
person_id INTEGER NOT NULL,
supervisor_id INTEGER,
role_id INTEGER,
FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE ,
FOREIGN KEY (supervisor_id) REFERENCES persons (id) ON DELETE SET NULL ,
FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL
);

CREATE TRIGGER users_updated_at AFTER UPDATE ON users WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE tags(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT
);

CREATE TRIGGER tags_updated_at AFTER UPDATE ON tags WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE products(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT
);

CREATE TRIGGER products_updated_at AFTER UPDATE ON products WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE media(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
url TEXT NOT NULL
);

CREATE TRIGGER media_updated_at AFTER UPDATE ON media WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE media SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE product_media(
    product_id INTEGER NOT NULL ,
    media_id INTEGER NOT NULL ,
    weight REAL ,
    UNIQUE(product_id, media_id) ,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ,
    FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE
);`);

  database.exec(`CREATE TABLE children(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT,
parent_id INTEGER,
FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TRIGGER children_updated_at AFTER UPDATE ON children WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE children SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  database.exec(`CREATE TABLE parents(
id INTEGER UNIQUE DEFAULT ((( strftime('%s','now') - 1563741060 ) * 100000) + (RANDOM() & 65535)) NOT NULL ,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ,
name TEXT
);

CREATE TRIGGER parents_updated_at AFTER UPDATE ON parents WHEN old.updated_at < CURRENT_TIMESTAMP BEGIN
UPDATE parents SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;`);

  Model.database = database;
  return database;
})();

describe('ORM write test', () => {
  beforeEach(async () => {
    await Central.init();

    db.exec(`
INSERT INTO tests (id, name) VALUES (1, 'Alice');
INSERT INTO tests (id, name) VALUES (2, 'Bob');
INSERT INTO tests (id, name) VALUES (3, 'Charlie');
INSERT INTO tests (id, name) VALUES (4, 'Dennis');
INSERT INTO tests (id, name) VALUES (2401110702891, 'Eric');
INSERT INTO tests (id, name) VALUES (2401110710563, 'Frank');

INSERT INTO persons (id, first_name, last_name, email) VALUES (1, 'Alice', 'Lee', 'alice@example.com');
INSERT INTO persons (id, first_name, last_name, email) VALUES (2, 'Bob', 'Man', 'bob@example.com');
INSERT INTO persons (id, first_name, last_name, email) VALUES (3, 'Charlie', 'Norman', 'charlie@example.com');
INSERT INTO persons (id, first_name, last_name, email) VALUES (4, 'Dennis', 'Oliver', 'dennis@example.com');
INSERT INTO persons (id, first_name, last_name, email) VALUES (5, 'Eric', 'Pang', 'eric@example.com');
INSERT INTO persons (id, first_name, last_name, email) VALUES (10, 'Frank', 'Quir', 'frank@example.com');
`);
  });

  afterEach(() => {
    db.exec('DELETE FROM tests');
    db.exec('DELETE FROM persons');
    db.exec('DELETE FROM roles');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM tags');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM media');
    db.exec('DELETE FROM product_media');
  });

  const exec = async (Model, input, params = {}, action = 'update') => {
    const controller = new ControllerTest({ params }, input, Model, db);
    const result = await controller.execute(action);
    if (result.status !== 200) {
      console.log(result);
      console.log(controller.error);
    }
    expect(result.status).toBe(200);
    return {
      result,
      sql: result.body.sql,
      queries: result.body.queries,
      instance: result.body.instance,
    };
  };

  test('constructor', async () => {
    const { result } = await exec(ModelTest, new Map(), {}, 'index');
    expect(result.body).toBe('index');
  });

  test('multiple update but no such item', async () => {
    const { sql, queries } = await exec(ModelTest, new Map([
      ['ModelTest', new Map([
        [2401110702890, new Map([['name', '111']])],
        [2401110710560, new Map([['name', '222']])],
      ])],
    ]));

    expect(sql[0]).toBe('SELECT * FROM tests WHERE id IN (?, ?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
    expect(queries[0].join()).toBe([2401110702890, 2401110710560].join());

    expect(sql.length).toBe(1);
  });

  test('multiple update', async () => {
    const { sql, queries } = await exec(ModelTest, new Map([
      ['ModelTest', new Map([
        [2401110702891, new Map([['name', '111']])],
        [2401110710563, new Map([['name', '222']])],
      ])],
    ]));

    expect(sql[0]).toBe('SELECT * FROM tests WHERE id IN (?, ?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
    expect(queries[0].join()).toBe([2401110702891, 2401110710563].join());
    expect(sql.length).toBe(3);

    const verify = db.prepare('SELECT * FROM tests').all();
    expect(verify[4].name).toBe('111');
    expect(verify[5].name).toBe('222');
    //    expect(body.mixin.get('sql')[0]).toBe('SELECT * FROM tests WHERE id in (2401110702891, 2401110710563)')
  });

  test('action update', async () => {
    const { sql } = await exec(ModelTest, new Map([
      ['ModelTest', new Map([
        ['?', new Map([['name', '111']])],
      ])],
    ]));

    expect(sql[0]).toBe('INSERT OR FAIL INTO tests (name, enabled, id) VALUES (?, ?, ?)');

    const verify = db.prepare('SELECT * FROM tests').all();
    expect(verify[6].name).toBe('111');
  });

  test('action create person', async () => {
    const { sql } = await exec(Person, new Map([
      ['Person', new Map([
        ['?', new Map([['first_name', 'Bob'], ['last_name', 'Chan']])],
      ])],
      ['User', new Map([
        ['?', new Map([['username', 'bobbob'], ['password', '#11111111'], ['.person_id:Person', '?']])],
      ])],
    ]));
    //    console.log(result.body.sql);
    //    console.log(result.body.queries);

    expect(sql[0]).toBe('INSERT OR FAIL INTO persons (first_name, last_name, phone, email, id) VALUES (?, ?, ?, ?, ?)');
    expect(sql[1]).toBe('INSERT OR FAIL INTO users (username, password, person_id, supervisor_id, role_id, id) VALUES (?, ?, ?, ?, ?, ?)');

    const verify = db.prepare('SELECT * FROM persons').all();
    expect(verify[6].first_name).toBe('Bob');

    const users = db.prepare('SELECT * FROM users where username = \'bobbob\'').get();
    expect(users.person_id).toBe(verify[6].id);
  });

  test('action update person with id', async () => {
    const { sql, queries } = await exec(Person, new Map([
      ['Person', new Map([
        [1, new Map([['first_name', 'Bob'], ['last_name', 'Ban']])],
      ])],
    ]), { id: 1 });

    expect(sql[0]).toBe('SELECT * FROM persons WHERE id IN (?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
    expect(queries[0].join()).toBe([1].join());
    expect(sql[1]).toBe('UPDATE persons SET first_name = ?, last_name = ?, phone = ?, email = ? WHERE id = ?');
    expect(queries[1].join()).toBe(['Bob', 'Ban', null, 'alice@example.com', 1].join());
  });

  test('action update person with id and new child', async () => {
    const { sql, queries } = await exec(Person, new Map([
      ['Person', new Map([
        [10, new Map([['first_name', 'Alice'], ['last_name', 'Chan']])],
      ])],
      ['User', new Map([
        ['?', new Map([['username', 'alicechan'], ['password', '#2222222'], ['.person_id:Person', 10]])],
      ])],
    ]), { id: 10 });

    expect(sql[0]).toBe('INSERT OR FAIL INTO users (username, password, person_id, supervisor_id, role_id, id) VALUES (?, ?, ?, ?, ?, ?)');

    expect(sql[1]).toBe('SELECT * FROM persons WHERE id IN (?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
    expect(queries[1].join()).toBe('10');
    expect(sql[2]).toBe('UPDATE persons SET first_name = ?, last_name = ?, phone = ?, email = ? WHERE id = ?');
    expect(queries[2].join()).toBe(['Alice', 'Chan', null, 'frank@example.com', 10].join());

    expect(queries[0][0]).toBe('alicechan');
    expect(queries[0][1]).toBe('#2222222');
    expect(queries[0][2]).toBe(10);
    expect(queries[0][3]).toBeFalsy();
  });

  test('create ORM with many to many', async () => {
    await Object.assign(ORM.create(Media, { insertID: 1 }), { url: 'https://example.com/1' }).write();
    await Object.assign(ORM.create(Media, { insertID: 2 }), { url: 'https://example.com/2' }).write();

    const { sql, queries, instance } = await exec(Product, new Map([
      ['Product', new Map([
        ['?', new Map([['name', 'Foo'], ['*Media', [1, 2]]])],
      ])],
    ]));

    expect(sql[0]).toBe('INSERT OR FAIL INTO products (name, id) VALUES (?, ?)');
    expect(sql[1]).toBe(`INSERT OR IGNORE INTO product_media (product_id, media_id, weight) VALUES (${instance.id} , ?, 0), (${instance.id} , ?, 0.000001)`);

    expect(queries[0].join()).toBe(['Foo', instance.id].join());
    expect(queries[1].join()).toBe([1, 2].join());

    const verify = db.prepare('SELECT * FROM product_media').all();
    expect(verify).toHaveLength(2);
  });

  test('create ORM with entity many to many', async () => {
    await Object.assign(ORM.create(Product, { insertID: 111 }), { name: 'Tshirt' }).write();

    const { sql, queries, instance } = await exec(Media, new Map([
      ['Media', new Map([
        ['?', new Map([['url', 'http://example.com'], ['*Product', [111]]])],
      ])],
    ]));

    expect(sql[0]).toBe('INSERT OR FAIL INTO media (url, id) VALUES (?, ?)');
    expect(queries[0][0]).toBe('http://example.com');
    expect(sql[1]).toBe(`INSERT OR IGNORE INTO product_media (media_id, product_id, weight) VALUES (${instance.id} , ?, 0)`);
  });

  test('createHasMany but values are not availabe', async () => {
    const { sql, queries, instance } = await exec(Person, new Map([
      ['Person', new Map([
        ['?', new Map([['first_name', 'Alice'], ['last_name', 'Chan']])],
      ])],
      ['User', new Map([
        ['?', new Map([['foo', ''], ['bar', ''], ['.person_id:Person', '?']])],
      ])],
    ]));

    expect(sql[0]).toBe('INSERT OR FAIL INTO persons (first_name, last_name, phone, email, id) VALUES (?, ?, ?, ?, ?)');
    expect(sql[1]).toBe('INSERT OR FAIL INTO users (username, password, person_id, supervisor_id, role_id, id) VALUES (?, ?, ?, ?, ?, ?)');
    expect(queries[0].join()).toBe(['Alice', 'Chan', null, null, instance.id].join());
    expect(queries[1][2]).toBe(instance.id);
  });

  test('belongsToFields', async () => {
    const { sql } = await exec(ModelChild, new Map([
      ['ModelChild', new Map([
        [10, new Map([['name', 'Alice'], ['parent_id', 1]])],
      ])],
    ]));

    expect(sql[0]).toBe('SELECT * FROM children WHERE id IN (?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
  });

  test('update value is boolean', async () => {
    const { sql, queries } = await exec(ModelTest, new Map([
      ['ModelTest', new Map([
        [1, new Map([['enabled', true]])],
        [2, new Map([['enabled', false]])],
      ])],
    ]));

    expect(sql[0]).toBe('SELECT * FROM tests WHERE id IN (?, ?) ORDER BY id ASC LIMIT 1000 OFFSET 0');
    expect(queries[0].join()).toBe([1, 2].join());
    expect(sql.length).toBe(3);

    const verify = db.prepare('SELECT * FROM tests').all();
  });
});
