declare module '@lionrockjs/central' {
  export class Central {
    static config: any;
    static log(message: any): void;
  }
  export class ORM {
    static database: any;
    static import(name: string): Promise<any>;
    static readWith(model: any, criteria: any[], options: any): Promise<any>;
    static countWith(model: any, criteria: any[], options: any): Promise<number>;
    static countAll(model: any, options: any): Promise<number>;
    static factory(model: any, id: any, options: any): Promise<any>;
    static create(model: any, options: any): any;
    static readBy(model: any, field: string, value: any[], options: any): Promise<any[]>;
  }
  export class ControllerMixinDatabase {
    static DATABASES: string;
  }
  export class HelperCrypto {
    static sign(secret: any, data: string): Promise<string>;
    static verify(secret: any, signature: string, data: string): Promise<boolean>;
  }
  export class Controller {
    static STATE_REQUEST: string;
    static STATE_PARAMS: string;
    static STATE_QUERY: string;
  }
  export class ControllerMixin {
  }
}

declare module '@lionrockjs/mvc' {
  export class Controller {
    static STATE_REQUEST: string;
    static STATE_PARAMS: string;
    static STATE_QUERY: string;
  }
  export class ControllerMixin {
  }
}
