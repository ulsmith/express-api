import Core from '../System/Core';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Base/Controller
 * @class Controller
 * @extends Core
 * @description System class to give a base for creating controllers, exposing services and base methods
 * @author Paul Smith
 * @license MIT 
 */
export default abstract class Controller<T extends GlobalsType> extends Core<T> {}

