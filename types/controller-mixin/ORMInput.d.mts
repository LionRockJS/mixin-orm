import { ControllerMixin } from '@lionrockjs/central';
export default class ORMInput extends ControllerMixin {
    static ORM_INPUT: string;
    static MODEL: string;
    static POST: string;
    static action_update(state: Map<string, any>): Promise<void>;
}
