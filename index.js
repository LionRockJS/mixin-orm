export default {
  filename: import.meta.url,
  configs: ['database', 'orm']
}

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