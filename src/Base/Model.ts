import Core from '../System/Core';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Base
 * @class Model
 * @extends Core
 * @description System class to give a base for creating Models, exposing services and base methods
 * @author Paul Smith
 * @license MIT 
 */
export default abstract class Model<T extends GlobalsType> extends Core<T> {}

