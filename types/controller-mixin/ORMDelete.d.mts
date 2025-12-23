import { ControllerMixin } from '@lionrockjs/central';
export default class ControllerMixinORMDelete extends ControllerMixin {
    static DELETE_SIGN: string;
    static DATABASE_KEY: string;
    static INSTANCE: string;
    static DELETED: string;
    static MODEL: string;
    static action_delete(state: Map<string, any>): Promise<void>;
}
