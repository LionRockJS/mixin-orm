import { Controller, ControllerMixin } from '@lionrockjs/mvc';
import { ORM } from '@lionrockjs/central';
import ControllerMixinORMRead from './ORMRead.mjs';

const mapGetOrCreate = (map, key, defaultValue) => {
  const result = map.get(key);

  if (!result) {
    map.set(key, defaultValue);
    return defaultValue;
  }

  return result;
};

/**
 *
 * @param {string} code
 * @param {number| string} currentID
 * @returns {number|string}
 */
const parseModelId = (code, currentID) => {
  if (!code || code === '()') return currentID;
  return parseInt(code.replace(/[^0-9]/g, ''), 10);
};

const parseFK = (code, defaultFK) => {
  if (!code || code === '-') return defaultFK;
  return code.replace(/^-/, '');
};

const parseClassField = async (result, postData, Model, currentID = '?') => {
  const pattern = /^(\(\d+\))?:(\w+)$/;

  await Promise.all([...postData.entries()].map(async (it) => {
    const key = it[0];
    const v = it[1];

    const matches = pattern.exec(key);
    if (!matches) return;

    const type = Model.name;
    const id = parseModelId(matches[1], currentID);
    const prop = matches[2];
    const value = Array.isArray(v) ? v.map(x => parseInt(x, 10)) : v;

    if (Array.isArray(v)) {
      const Type = await ORM.import(prop);
      if (!Model.belongsToMany.has(prop) && !Type.belongsToMany.has(type)) throw new Error(`Invalid input siblings ${prop} for ${Model.name}`);
    } else if (!Model.fields.has(prop) && !Model.belongsTo.has(prop)) {
      throw new Error(`Invalid input field ${prop} for ${Model.name}`);
    }

    const instancesType = mapGetOrCreate(result, type, new Map());
    const instanceTypeId = mapGetOrCreate(instancesType, id, new Map());
    if (id === '?' && value === '') {
      postData.delete(key);
      return;
    }

    instanceTypeId.set(prop, value);
    postData.delete(key);
  }));

  return result;
};

const parseChildField = async (result, postData, Model, currentID = '?') => {
  const pattern = /^(\(\d+\))?>(\w+)(\(\d*\))?(-\w+)?:(\w+)$/;
  await Promise.all(
  [...postData.entries()].map(async (it) => {
    const key = it[0];
    const v = it[1];
    const matches = pattern.exec(key);
    if (!matches) return;

    const parentID = parseModelId(matches[1], currentID);

    const type = matches[2];
    const id = parseModelId(matches[3], '?');
    if (id !== '?' && parentID === '?') throw new Error(`${type}(${id}) cannot own by new ${Model.name}() `);

    const fk = parseFK(matches[4], `${Model.joinTablePrefix}_id`);
    const prop = matches[5];
    const value = Array.isArray(v) ? v.map(x => parseInt(x, 10)) : v;

    const Type = await ORM.import(type);
    if (!(Type.fields.has(prop) || Type.belongsTo.has(prop))) throw new Error(`Invalid input field ${prop} for ${Type.name}`);
    if (!(Type.belongsTo.has(fk) || Type.hasMany.map(x=>x[1]).includes(Model.name))) throw new Error(`Invalid FK ${fk} for ${Type.name}`);

    const instancesType = mapGetOrCreate(result, type, new Map());
    const instanceTypeId = mapGetOrCreate(instancesType, id, new Map([[`.${fk}:${Model.name}`, parentID]]));
    instanceTypeId.set(prop, value);

    postData.delete(key);
  }));
};

const parseAddSibling = async (result, postData, Model, currentID = '?') => {
  const pattern = /^(\(\d+\))?\*(\w+)([\[(][\])])?$/;
  await Promise.all([...postData.entries()].map(async (it) => {
    const key = it[0];
    const v = it[1];
    const matches = pattern.exec(key);
    if (!matches) return;
    if (!Array.isArray(v)) throw new Error(`${key} must be array`);

    const type = matches[2];
    const id = parseModelId(matches[1], currentID);
    const prop = `*${matches[2]}`;
    const value = v.map(x => ((x === 'replace') ? x : parseInt(x, 10)));

    const Type = await ORM.import(type);
    if (!Model.belongsToMany.has(type) && !Type.belongsToMany.has(Model.name)) {
      throw new Error(`Invalid hasAndBelongsToMany ${type} and ${Model.name}`);
    }

    const instancesType = mapGetOrCreate(result, Model.name, new Map());
    const instanceTypeId = mapGetOrCreate(instancesType, id, new Map());
    instanceTypeId.set(prop, value);

    postData.delete(key);
  }));
  return result;
};

const parseChainChild = async (result, postData, Model, currentID = '?') => {
  const pattern = /^(\(\d+\))?(>(\w+)(\(\d*\)))?(>(\w+)(\(\d*\)))?(>(\w+)(\(\d*\)))?(>(\w+)(\(\d*\)))?(>(\w+)(\(\d*\)))?:(\w+)$/;

  await Promise.all(
  [...postData.entries()].map(async (it) => {
    const v = it[0];
    const key = it[1];
    const matches = pattern.exec(key);
    if (!matches) return;

    const types = [matches[3], matches[6], matches[9], matches[12], matches[15]].filter(x => !!x).map(async x => await ORM.import(x));
    const ids = [matches[4], matches[7], matches[10], matches[13], matches[16]].filter(x => !!x);
    types.unshift(Model);
    types.forEach((m, i) => {
      if (i === 0) return;
      const parentType = types[i - 1];
      if (parentType.belongsTo.has(m.name)) throw new Error(`${m.name} not belongs to ${parentType.name}`);
    });

    const id = parseModelId(ids.pop(), currentID);
    const Type = types.pop();
    const prop = matches[17];
    const value = Array.isArray(v) ? v.map(x => parseInt(x, 10)) : v;
    if (!Type.fields.has(prop) && !Type.belongsTo.has(prop)) throw new Error(`Invalid input field ${prop} for ${Type.name}`);

    const instancesType = mapGetOrCreate(result, Type.name, new Map());
    const instanceTypeId = mapGetOrCreate(instancesType, id, new Map());
    instanceTypeId.set(prop, value);

    postData.delete(key);
  }));
};

// parse form input to update list, with validate
export default class ORMInput extends ControllerMixin {
  static ORM_INPUT = 'ORMInput';

  static MODEL = 'inputModel';

  static POST = '$_POST';

  static async action_update(state) {
    const model   = state.get(this.MODEL) ?? state.get(ControllerMixinORMRead.MODEL);
    const { id } = state.get(Controller.STATE_PARAMS);
    const $_POST = state.get(this.POST);
    const postData = new Map(Object.entries($_POST));
    // parse postData;
    // find instance fields
    const updates = new Map();

    await parseClassField(updates, postData, model, id);
    await parseChildField(updates, postData, model, id);
    await parseAddSibling(updates, postData, model, id);
    await parseChainChild(updates, postData, model, id);

    state.set(this.ORM_INPUT, updates);
  }
}