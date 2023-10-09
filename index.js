import url from "node:url";
const dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');
export default {dirname}

import ControllerMixinORMInput from './classes/controller-mixin/ORMInput.mjs';
import ControllerMixinORMRead from './classes/controller-mixin/ORMRead.mjs';
import ControllerMixinORMWrite from './classes/controller-mixin/ORMWrite.mjs';
import ControllerMixinORMDelete from './classes/controller-mixin/ORMDelete.mjs';

export {
  ControllerMixinORMInput,
  ControllerMixinORMRead,
  ControllerMixinORMWrite,
  ControllerMixinORMDelete
}