import { Controller, ControllerMixin } from '@lionrockjs/mvc';
import { Central, ORM, ControllerMixinDatabase } from '@lionrockjs/central';
import { HelperCrypto } from '@lionrockjs/mod-crypto';
import ControllerMixinORMRead from './ORMRead.mjs';

export default class ControllerMixinORMDelete extends ControllerMixin {
  static DELETE_SIGN = 'deleteSign';

  static DATABASE_KEY = 'ormDatabaseDeleteKey';

  static INSTANCE = 'instance';

  static DELETED = 'deleted';

  static MODEL = 'deleteModel';

  static async action_delete(state) {
    const request = state.get(Controller.STATE_REQUEST);
    const { id } = state.get(Controller.STATE_PARAMS);
    const model = state.get(this.MODEL) ?? state.get(ControllerMixinORMRead.MODEL);

    if (!id) throw new Error(`Delete ${model.name} without object id`);

    const { deleteKey } = Central.config.database;
    const value = model.tableName + id;
    state.set(this.DELETE_SIGN, (deleteKey) ? await HelperCrypto.sign(deleteKey, value) : 'true');

    const { confirm } = request.query;
    if (!confirm) return;

    const verify = (deleteKey) ? await HelperCrypto.verify(Central.config.database.deleteKey, confirm, value) : true;
    if (!verify) throw new Error('Invalid delete signature.');

    const dbAlias = state.get(this.DATABASE_KEY) || state.get('ormDatabaseReadKey');
    const db = state.get(ControllerMixinDatabase.DATABASES).get(dbAlias);
    const m = await ORM.factory(model, id, { database: db });
    m.snapshot();
    state.set('instance', m);
    await m.delete();
    state.set(this.DELETED, true);
  }
}
