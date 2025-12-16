import Core from '../System/Core';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Base/Middleware
 * @class Middleware
 * @extends Core
 * @description System class to give a base for creating middleware, exposing services and base methods
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT 
 */
export default abstract class Middleware<T extends GlobalsType> extends Core<T> {}

