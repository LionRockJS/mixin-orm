import { ControllerMixin } from '@lionrockjs/central';
export default class ControllerMixinORMRead extends ControllerMixin {
    #private;
    static ORM_OPTIONS: string;
    static MODEL: string;
    static INSTANCES: string;
    static INSTANCE: string;
    static COUNT: string;
    static DATABASE_KEY: string;
    static LIST_FILTER: string;
    static PAGINATE: string;
    static init(state: Map<string, any>): void;
    static verfiy_order_by(state: Map<string, any>): void;
    static action_index(state: Map<string, any>): Promise<void>;
    static action_read(state: Map<string, any>): Promise<void>;
    static action_edit(state: Map<string, any>): Promise<void>;
}
