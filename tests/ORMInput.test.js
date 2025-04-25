import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import qs from 'node:querystring';
import { Controller } from '@lionrockjs/mvc';
import { Central } from '@lionrockjs/central';

import ControllerMixinORMInput from '../classes/controller-mixin/ORMInput';

import Person from './classes/model/Person.mjs';
import User from './classes/model/User.mjs';
import Role from './classes/model/Role.mjs';
import Tag from './classes/model/Tag.mjs';

Central.classPath.set('helper/Form.mjs', path.normalize(`${__dirname}/../classes/helper/Form.js`));
Central.classPath.set('model/Person.mjs', Person);
Central.classPath.set('model/User.mjs', User);
Central.classPath.set('model/Role.mjs', Role);
Central.classPath.set('model/Tag.mjs', Tag);

class ControllerTest extends Controller {
  static mixins = [ControllerMixinORMInput];

  constructor(request, Model) {
    super(request, new Map([
      [ControllerMixinORMInput.POST, (typeof request.body === 'object') ? request.body : qs.parse(request.body)],
      [ControllerMixinORMInput.MODEL, Model],
    ]));
  }

  async action_index() {
    this.state.set(Controller.STATE_BODY, 'index');
  }

  async action_update() {
    this.state.set(Controller.STATE_BODY, {
      update: this.state.get(ControllerMixinORMInput.ORM_INPUT),
    });
  }
}

describe('orm input parse', () => {
  beforeEach(async () => {
    await Central.init();
  });

  afterEach(async () => {
  });

  test('init', async () => {
    const c = new ControllerTest({ headers: {}, params: {}, body: {} }, Person);
    const result = await c.execute();
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);
    expect(result.body).toBe('index');
  });

  test('currentField, new instance', async () => {
    const c = new ControllerTest({ headers: {}, params: {}, body: ':first_name=Alice&:last_name=Lee' }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const m1 = result.body.update.get('Person').get('?');
    expect(m1).toBeDefined();
    expect(m1.get('first_name')).toBe('Alice');
    expect(m1.get('last_name')).toBe('Lee');
  });

  test('currentField', async () => {
    const c = new ControllerTest({ headers: {}, params: { id: 1 }, body: ':first_name=Alice&:last_name=Lee' }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const m1 = result.body.update.get('Person').get(1);
    expect(m1.get('first_name')).toBe('Alice');
    expect(m1.get('last_name')).toBe('Lee');
  });

  test('currentField, multiple instance', async () => {
    const c = new ControllerTest({
      headers: {},
      params: { id: 1 },
      body: ':first_name=Alice&(10):last_name=Lee&>User():username=alicelee001&>User(100):username=alicelee',
    }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const m1 = result.body.update.get('Person').get(1);
    expect(m1.get('first_name')).toBe('Alice');

    const m2 = result.body.update.get('Person').get(10);
    expect(m2.get('last_name')).toBe('Lee');
  });

  test('children, with id', async () => {
    const c = new ControllerTest({
      headers: {},
      params: { id: 1 },
      body: ':first_name=Alice&(10):last_name=Lee&>User():username=alicelee001&>User(100):username=alicelee',
    }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const u = result.body.update.get('User');
    const u1 = u.get(100);
    expect(u1.get('username')).toBe('alicelee');

    const nu = u.get('?');
    expect(nu.get('username')).toBe('alicelee001');
  });

  test('children, new Model', async () => {
    const c = new ControllerTest({ headers: {}, params: {}, body: ':first_name=Alice&>User():username=alicelee001&(50)>User(4):username=bobo' }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const u = result.body.update.get('User');
    const u1 = u.get('?');
    expect(u1.get('.person_id:Person')).toBe('?');
    expect(u1.get('username')).toBe('alicelee001');

    const u2 = u.get(4);
    expect(u2.get('.person_id:Person')).toBe(50);
    expect(u2.get('username')).toBe('bobo');
  });

  test('children, explicit fk', async () => {
    const c = new ControllerTest({
      headers: {},
      params: { id: 1 },
      body: '>User(4)-person_id:username=coco&>User(5)-supervisor_id:username=soso&>User()-supervisor_id:username=fofo&>User():username=koko',
    }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);

    const u = result.body.update.get('User');
    const u1 = u.get(4);
    expect(u1.get('.person_id:Person')).toBe(1);
    expect(u1.get('username')).toBe('coco');

    const u2 = u.get(5);
    expect(u2.get('.supervisor_id:Person')).toBe(1);
    expect(u2.get('username')).toBe('soso');

    const u3 = u.get('?');
    expect(u3.get('.supervisor_id:Person')).toBe(1);
    expect(u3.get('username')).toBe('koko');
  });

  // recursive children?

  test('siblings', async () => {
    const c = new ControllerTest({
      headers: {},
      params: { id: 1 },
      body: '(20)~Tag[]=3&(20)~Tag[]=4&(20)~Tag[]=1&(20)~Tag[]=2&~Tag[]=5&~Tag[]=6&~Tag[]=7&~Tag[]=8',
    }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);
    const p = result.body.update.get('Person');
    const p1 = p.get(1);
    expect(p1.get('~Tag').sort().join()).toBe([5,6,7,8].join());
    const p20 = p.get(20);
    expect(p20.get('~Tag').sort().join()).toBe([1,2,3,4].join());
  });

  test('invalid siblings', async () => {
    /* Person belongsMany Tags,  */
    const c = new ControllerTest({ headers: {}, params: { id: 1 }, body: ':User[]=1&:User[]=2&~User[]=3&~User[]=4' }, Tag);
    const result = await c.execute('update');
    expect(result.status).toBe(500);
    expect(c.error.message).toBe('Invalid hasAndBelongsToMany User and Tag');
  });

  test('invalid addvsiblings', async () => {
    /* Person belongsMany Tags,  */
    const c = new ControllerTest({ headers: {}, params: { id: 1 }, body: '~User[]=3&~User[]=4' }, Tag);
    const result = await c.execute('update');
    expect(result.status).toBe(500);
    expect(c.error.message).toBe('Invalid hasAndBelongsToMany User and Tag');
  });

  test('parse action create person', async () => {
    const c = new ControllerTest({
      headers: {},
      params: {},
      body: {
        ':first_name': 'Bob',
        ':last_name': 'Chan',
        '>User():username': 'bobbob',
        '>User():password': '#11111111',
      },
    }, Person);
    const result = await c.execute('update');
    if (result.status !== 200)console.log(result);
    expect(result.status).toBe(200);
  });

  test('coverage test, Invalid input field prop for Model.name', async () => {
    new ControllerTest({
      headers: {},
      params: {},
      body: {
        ':xxx': 'not available',
      },
    }, Person);
  });
});
