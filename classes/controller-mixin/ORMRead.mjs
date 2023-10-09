import { ControllerMixin } from '@lionrockjs/mvc';
import { ORM, ControllerMixinDatabase } from '@lionrockjs/central';

export default class ControllerMixinORMRead extends ControllerMixin {
  static ORM_OPTIONS = 'orm_read_options';

  static MODEL = 'orm_model';

  static INSTANCES = 'instances';

  static INSTANCE = 'instance';

  static COUNT = 'count';

  static DATABASE_KEY = 'ormDatabaseReadKey';

  static LIST_FILTER = 'listFilter';

  static #formatDate(date) {
    let d = date,
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

  static init(state) {

    if (!state.get(this.ORM_OPTIONS)) {
      state.set(this.ORM_OPTIONS, new Map([
        ['orderBy', new Map([['id', 'ASC']])],
        ['limit', 50],
        ...state.get(this.ORM_OPTIONS) || [],
      ]));
    }

    if (!state.get(this.DATABASE_KEY)) state.set(this.DATABASE_KEY, 'admin');
    if (!state.get(this.MODEL)) state.set(this.MODEL, state.get(this.MODEL));
    if (!state.get(this.LIST_FILTER)) state.set(this.LIST_FILTER, []);

    //security check order by options
    const orderBy = state.get(this.ORM_OPTIONS).get('orderBy');
    [...orderBy.values()].forEach(it => {
      const orderDirection = it.trim().toUpperCase();
      if(orderDirection !== 'ASC' && orderDirection !== 'DESC'){
        throw new Error('ORDER BY must be ASC or DESC, received:' + orderDirection);
      }
    })
  }

  static verify_order_by_columns(Model, state){
    const orderBy = state.get(this.ORM_OPTIONS).get('orderBy');
    //keys should be column names
    const columns = [...Model.fields.keys()];
    [...orderBy.keys()].forEach(it => {
      if(it === 'id' || it === 'created_at' || it === 'updated_at') return;
      if(!columns.includes(it)){
        throw new Error(`ORDER BY column ${it} not found in model ${Model.name}`);
      }
    });
  }

  static async action_index(state) {
    const client = state.get(ControllerMixin.CLIENT);
    const model = state.get(this.MODEL) ?? client.model;

    if (!model) return;
    this.verify_order_by_columns(model, state);

    const database = state.get(ControllerMixinDatabase.DATABASES)?.get(state.get(this.DATABASE_KEY)) ?? ORM.database;
    const options = Object.fromEntries(state.get(this.ORM_OPTIONS).entries());

    const page = parseInt(client.request.query.page ?? '1', 10) - 1;
    const offset = page * options.limit;

    const start = client.request.query.start ?? '1970-1-1';
    const end = this.#formatDate(new Date(new Date(client.request.query.end ?? '2999-12-31').getTime() + 86400000));

    const criteria = [
      ['', 'created_at', 'GREATER_THAN_EQUAL', `${start} 00:00:00+08:00`],
      ['AND', 'created_at', 'LESS_THAN_EQUAL', `${end} 00:00:00+08:00`],
      ...state.get(this.LIST_FILTER)
    ];

    const result = await ORM.readWith(model, criteria,{ database, ...options, offset, asArray:true });

    state.set(this.COUNT, await ORM.countWith(model, criteria,{ database }));
    state.set(this.INSTANCES, result);
  }

  static async action_read(state) {
    const client = state.get(ControllerMixin.CLIENT);
    const model = state.get(this.MODEL) ?? client.model;

    if (!model) throw new Error('Controller Mixin ORM Read without model');
    this.verify_order_by_columns(model, state);

    const id = client.request.params.id;
    const database = state.get(ControllerMixinDatabase.DATABASES).get(state.get(this.DATABASE_KEY));

    state.set(this.COUNT, await ORM.count(model, { database }));
    state.set(this.INSTANCE, await ORM.factory(model, id, { database }));
  }

  static async action_edit(state) {
    await this.action_read(state);
  }
}
