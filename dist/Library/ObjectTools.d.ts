/**
 * @module express-api/Library/ObjectTools
 * @class ObjectTools
 * @description Set of tools for playing with objects
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ObjectTools {
    /**
     * @public @static @name propertiesMatch
     * @description Check properties match in two objects, to ensure they have the same properties in both
     * @param {String} obj1 The first object
     * @param {String} obj2 The second object
     * @return {Boolean} True is both objects have the same properties
     */
    static propertiesMatch(obj1: object, obj2: object): boolean;
    /**
     * @public @static @name propertiesExist
     * @description Check properties from obj1 exist in obj2, to ensure min requirement is met
     * @param {String} obj1 The first object
     * @param {String} obj2 The second object
     * @return {Boolean} True is both objects have the same properties
     */
    static propertiesExist(obj1: any, obj2: any): boolean;
}
//# sourceMappingURL=ObjectTools.d.ts.map