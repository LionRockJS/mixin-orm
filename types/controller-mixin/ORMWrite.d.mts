import { ControllerMixin } from '@lionrockjs/mvc';
export default class ControllerMixinORMWrite extends ControllerMixin {
    #private;
    static DATABASE_KEY: string;
    static MODEL: string;
    static ORM_OPTIONS: string;
    static INSTANCE: string;
    static init(state: Map<string, any>): void;
    static action_update(state: Map<string, any>): Promise<void>;
}
