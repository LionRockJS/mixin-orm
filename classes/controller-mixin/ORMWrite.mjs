import { Controller, ControllerMixin } from '@lionrockjs/mvc';
import { ORM, ControllerMixinDatabase } from '@lionrockjs/central';
import ControllerMixinORMInput from './ORMInput.mjs';
import ControllerMixinORMRead from './ORMRead.mjs';

export default class ControllerMixinORMWrite extends ControllerMixin {
  static DATABASE_KEY = 'ormDatabaseWriteKey';

  static MODEL = 'writeModel';

  static ORM_OPTIONS = 'orm_write_options';

  static INSTANCE = 'instance';

  static init(state) {
    if (!state.get(ControllerMixinORMWrite.DATABASE_KEY))state.set(ControllerMixinORMWrite.DATABASE_KEY, '');
  }

  /**
   *
   * @param state
   * @returns {Promise<void>}
   */
  static async action_update(state) {
    const { id } = state.get(Controller.STATE_PARAMS);

    const model = state.get(this.MODEL) ?? state.get(ControllerMixinORMRead.MODEL);
    const databaseKey = state.get(this.DATABASE_KEY) || state.get(ControllerMixinORMRead.DATABASE_KEY);
    const database = state.get(ControllerMixinDatabase.DATABASES).get(databaseKey);

    const mergedOptions = new Map([...state.get(ControllerMixinORMRead.ORM_OPTIONS) || [], ...(state.get(this.ORM_OPTIONS) || [])]);
    const ormOptions = Object.fromEntries(mergedOptions.entries());
    ormOptions.orderBy = new Map([['id', 'ASC']]);
    ormOptions.database = database;

    const input = state.get(ControllerMixinORMInput.ORM_INPUT);
    const ins = await this.#newInstance(input, model, ormOptions);

    // assign new created instance to client
    await this.#newChild(input, ins, ormOptions);

    await this.#updateInstances(input, id, ormOptions, state);

    if (!state.get(this.INSTANCE)) {
      state.set(this.INSTANCE, ins);
    }
  }

  /**
   *
   * @param {Map} input
   * @param {ORM} model
   * @param {Object} orm_options
   */
  static async #newInstance(input, model, orm_options) {
    const mapNewInstance = input.get(model.name)?.get('?');
    if (!mapNewInstance) return null;

    const instance = ORM.create(model, orm_options);
    mapNewInstance.forEach((v, key) => {
      if (Array.isArray(v)) return;
      instance[key] = v;
      mapNewInstance.delete(key);
    });
    await instance.write();

    // add many to many
    await Promise.all(
      Array.from(mapNewInstance.entries()).map(async v => {
        const key = v[0];
        if (!/^[*:]/.test(key)) return;

        const ModelB = await ORM.import(key.slice(1));
        const models = v[1].filter(id => id !== 'replace').map(id => new ModelB(id, orm_options));
        if (models.length === 0) return;
        await instance.add(models);
        mapNewInstance.delete(key);
      }),
    );

    // remove used map
    input.get(model.name).delete('?');

    return instance;
  }

  /**
   *
   * @param {Map} input
   * @param {Number | String} id
   * @param {Object} orm_options
   * @param {Map} state
   * @returns {Promise<void>}
   */
  static async #updateInstances(input, id, orm_options, state) {
    await Promise.all(
      Array.from(input.entries()).map(async x => {
        // this type is empty, quit;
        if (x[1].size === 0) return;

        const MClass = await ORM.import(x[0]);
        const ids = Array.from(x[1].keys());

        const results = await ORM.readBy(MClass, 'id', ids, { ...orm_options, asArray: true });

        await Promise.all(
          results.map(async model => {
            const m = model;
            if (id && m.id.toString() === id.toString()) {
              state.set(this.INSTANCE, m);
              m.snapshot();
            }
            const newValues = x[1].get(m.id) ?? x[1].get(String(m.id));
            let changed = false;

            MClass.fields.forEach((xx, field) => {
              const v = newValues.get(field);
              if (v === undefined) return;
              m[field] = v;
              changed = true;
            });

            MClass.belongsTo.forEach((xx, field) => {
              const v = newValues.get(field);
              if (v === undefined || v === '') return;
              m[field] = v;
              changed = true;
            });

            MClass.belongsToMany.forEach(field => {
              const k = `*${field}`;
              const v = newValues.get(k);
              if (v === undefined || v === '') return;
              m[k] = v;
              changed = true;
            });

            if (changed) {
              const instance = new MClass(m.id, orm_options);
              Object.assign(instance, m);
              await instance.write();

              const manyOps = [];
              await Promise.all(

                [...MClass.belongsToMany].map(async xx => {
                  const k = `*${xx}`;
                  if (m[k] === undefined) return;
                  if (!Array.isArray(m[k])) throw new Error(`${k} must be Array`);

                  const ModelB = await ORM.import(k.slice(1));
                  const many = m[k].filter(nid => nid !== 'replace').map(nid => new ModelB(nid, orm_options));
                  if (many.length !== m[k].length)manyOps.push(instance.removeAll(ModelB));
                  if (many.length > 0)manyOps.push(instance.add(many));
                })

              );

              await Promise.all(manyOps);
            }
          }),
        );
      }),
    );
  }

  static async #newChild(input, parent, orm_options) {
    await Promise.all(
      Array.from(input.entries()).map(async x => {
        const list = x[1];
        const type = x[0];

        const Model = await ORM.import(type);

        const newValues = x[1].get('?');
        if (!newValues) return;
        // the map have no fields, skip it.
        if (newValues.size <= 1) return;

        const instance = ORM.create(Model, orm_options);

        Model.fields.forEach((xx, field) => {
          const v = newValues.get(field);
          if (v === undefined || v === '') return;
          instance[field] = v;
          newValues.delete(field);
        });

        Model.belongsTo.forEach((ParentModel, fk) => {
          const parentID = newValues.get(`.${fk}:${ParentModel}`);
          if (!parentID) return;
          instance[fk] = (parentID === '?') ? parent.id : parentID;
        });

        await instance.write();
        list.delete('?');
      }),
    );
  }
}