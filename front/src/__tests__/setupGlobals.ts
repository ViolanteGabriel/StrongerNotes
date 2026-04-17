import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
