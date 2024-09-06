import { Controller, ControllerMixin, ORM, ControllerMixinDatabase } from '@lionrockjs/central';

export default class ControllerMixinORMRead extends ControllerMixin {
  static ORM_OPTIONS = 'orm_read_options';

  static MODEL = 'orm_model';

  static INSTANCES = 'instances';

  static INSTANCE = 'instance';

  static COUNT = 'count';

  static DATABASE_KEY = 'ormDatabaseReadKey';

  static LIST_FILTER = 'listFilter';

  static PAGINATE = 'paginate'

  static #formatDate(date) {
    const YYYY  = date.getFullYear();
    const MONTH = String(date.getMonth() + 1).padStart(2, '0');
    const DATE  = String( date.getDate() ).padStart(2, '0');
    return `${YYYY}-${MONTH}-${DATE}`;
  }

  static init(state) {
    state.set(this.ORM_OPTIONS, new Map([
      ['orderBy', new Map([['id', 'ASC']])],
      ['limit', 50],
      ...state.get(this.ORM_OPTIONS) || [],
    ]));

    if (!state.get(this.DATABASE_KEY)) state.set(this.DATABASE_KEY, 'admin');
    if (!state.get(this.MODEL)) state.set(this.MODEL, state.get(this.MODEL));
    if (!state.get(this.LIST_FILTER)) state.set(this.LIST_FILTER, []);

    //security check order by options
    this.verfiy_order_by(state);
  }

  static verfiy_order_by(state){
    const orderBy = state.get(this.ORM_OPTIONS).get('orderBy');
    [...orderBy.values()].forEach(it => {
      const orderDirection = it.trim().toUpperCase();
      if(orderDirection !== 'ASC' && orderDirection !== 'DESC'){
        throw new Error('ORDER BY must be ASC or DESC, received:' + orderDirection);
      }
    });

    const Model = state.get(this.MODEL);
    if (!Model)return;

    const columns = [...Model.fields.keys()];
    [...orderBy.keys()].forEach(it => {
      if(it === 'id' || it === 'created_at' || it === 'updated_at') return;
      if(!columns.includes(it)){
        throw new Error(`ORDER BY column ${it} not found in model ${Model.name}`);
      }
    });
  }

  static async action_index(state) {
    const model = state.get(this.MODEL);
    if (!model) return;

    this.verfiy_order_by(state);

    const database = state.get(ControllerMixinDatabase.DATABASES)?.get(state.get(this.DATABASE_KEY)) ?? ORM.database;
    const options = Object.fromEntries(state.get(this.ORM_OPTIONS).entries());

    const query = state.get(Controller.STATE_QUERY);
    const page = parseInt(query.page ?? '1', 10) - 1;
    const offset = page * options.limit;

    const start = query.start ?? '1970-1-1';
    const end = this.#formatDate(new Date(new Date(query.end ?? '2999-12-31').getTime() + 86400000));

    const criteria = [
      ['', 'created_at', 'GREATER_THAN_EQUAL', `${start} 00:00:00+08:00`],
      ['AND', 'created_at', 'LESS_THAN_EQUAL', `${end} 00:00:00+08:00`],
      ...state.get(this.LIST_FILTER)
    ];

    const result = await ORM.readWith(model, criteria,{ database, ...options, offset, asArray:true });
    const count = await ORM.countWith(model, criteria,{ database });

    state.set(this.COUNT, count);
    state.set(this.INSTANCES, result);
    state.set(this.PAGINATE, {
      current_offset: offset,
      current_page: page + 1,
      items: count,
      page_param: model.tableName,
      page_size: options.limit,
      pages: Math.ceil(count / options.limit),
      parts:[],
      previous:{},
      next:{},
    })
  }

  static async action_read(state) {
    const model = state.get(this.MODEL);

    if (!model) throw new Error('Controller Mixin ORM Read without model');
    this.verfiy_order_by(state);

    const {id} = state.get(Controller.STATE_PARAMS);
    const database = state.get(ControllerMixinDatabase.DATABASES).get(state.get(this.DATABASE_KEY));

    state.set(this.COUNT, await ORM.countAll(model, { database }));
    state.set(this.INSTANCE, await ORM.factory(model, id, { database }));
  }

  static async action_edit(state) {
    await this.action_read(state);
  }
}
