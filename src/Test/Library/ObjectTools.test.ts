import ObjectTools from '../../Library/ObjectTools';

describe('ObjectTools', () => {
	describe('propertiesMatch', () => {
		it('should return true when objects have identical properties', () => {
			const obj1 = { a: 1, b: 2, c: 3 };
			const obj2 = { a: 10, b: 20, c: 30 };
			expect(ObjectTools.propertiesMatch(obj1, obj2)).toBe(true);
		});

		it('should return false when objects have different properties', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 2, c: 3 };
			expect(ObjectTools.propertiesMatch(obj1, obj2)).toBe(false);
		});

		it('should return false when first object has extra properties', () => {
			const obj1 = { a: 1, b: 2, c: 3 };
			const obj2 = { a: 1, b: 2 };
			expect(ObjectTools.propertiesMatch(obj1, obj2)).toBe(false);
		});

		it('should return true for empty objects', () => {
			const obj1 = {};
			const obj2 = {};
			expect(ObjectTools.propertiesMatch(obj1, obj2)).toBe(true);
		});

		it('should handle objects with different property values but same keys', () => {
			const obj1 = { name: 'John', age: 25 };
			const obj2 = { name: 'Jane', age: 30 };
			expect(ObjectTools.propertiesMatch(obj1, obj2)).toBe(true);
		});
	});

	describe('propertiesExist', () => {
		it('should return true when all properties from obj1 exist in obj2', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 2, c: 3, d: 4 };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(true);
		});

		it('should return false when a property from obj1 is missing in obj2', () => {
			const obj1 = { a: 1, b: 2, c: 3 };
			const obj2 = { a: 1, b: 2 };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(false);
		});

		it('should return false when obj2 property is falsy', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: 0 };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(false);
		});

		it('should return false when obj2 property is null', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1, b: null };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(false);
		});

		it('should return false when obj2 property is undefined', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 1 };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(false);
		});

		it('should return true when obj2 has truthy values for all obj1 properties', () => {
			const obj1 = { name: 'John', active: true };
			const obj2 = { name: 'Jane', active: true, extra: 'data' };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(true);
		});

		it('should return true for empty obj1', () => {
			const obj1 = {};
			const obj2 = { a: 1, b: 2 };
			expect(ObjectTools.propertiesExist(obj1, obj2)).toBe(true);
		});
	});
});

