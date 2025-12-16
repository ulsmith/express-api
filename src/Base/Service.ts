import Core from '../System/Core';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Base/Service
 * @class Service
 * @extends Core
 * @description System class to give a base for creating services
 * @author Paul Smith
 * @license MIT 
 */
export default abstract class Service<T extends GlobalsType> extends Core<T> {}

