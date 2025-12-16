import Crypto from '../../Library/Crypto';
import JWT from 'jsonwebtoken';

describe('Crypto', () => {
	describe('md5', () => {
		it('should generate MD5 hash for string', () => {
			const hash = Crypto.md5('hello');
			expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
		});

		it('should generate consistent hash for same input', () => {
			const hash1 = Crypto.md5('test');
			const hash2 = Crypto.md5('test');
			expect(hash1).toBe(hash2);
		});

		it('should generate different hash for different input', () => {
			const hash1 = Crypto.md5('hello');
			const hash2 = Crypto.md5('world');
			expect(hash1).not.toBe(hash2);
		});

		it('should handle empty string', () => {
			const hash = Crypto.md5('');
			expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e');
		});

		it('should handle special characters', () => {
			const hash = Crypto.md5('hello@world#123');
			expect(typeof hash).toBe('string');
			expect(hash.length).toBe(32);
		});
	});

	describe('sha256', () => {
		it('should generate SHA256 hash for string', () => {
			const hash = Crypto.sha256('hello');
			expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
		});

		it('should generate consistent hash for same input', () => {
			const hash1 = Crypto.sha256('test');
			const hash2 = Crypto.sha256('test');
			expect(hash1).toBe(hash2);
		});

		it('should generate different hash for different input', () => {
			const hash1 = Crypto.sha256('hello');
			const hash2 = Crypto.sha256('world');
			expect(hash1).not.toBe(hash2);
		});

		it('should handle empty string', () => {
			const hash = Crypto.sha256('');
			expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
		});

		it('should handle unicode characters', () => {
			const hash = Crypto.sha256('你好');
			expect(typeof hash).toBe('string');
			expect(hash.length).toBe(64);
		});
	});

	describe('passwordHash', () => {
		it('should generate password hash without salt', () => {
			const hash = Crypto.passwordHash('mypassword');
			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		});

		it('should generate different hash each time without salt', () => {
			const hash1 = Crypto.passwordHash('mypassword');
			const hash2 = Crypto.passwordHash('mypassword');
			// Should be different due to random salt
			expect(hash1).not.toBe(hash2);
		});

		it('should generate consistent hash with same salt', () => {
			const salt = Crypto.sha256('mysalt');
			const hash1 = Crypto.passwordHash('mypassword', salt);
			const hash2 = Crypto.passwordHash('mypassword', salt);
			expect(hash1).toBe(hash2);
		});

		it('should generate different hash for different password with same salt', () => {
			const salt = Crypto.sha256('mysalt');
			const hash1 = Crypto.passwordHash('password1', salt);
			const hash2 = Crypto.passwordHash('password2', salt);
			expect(hash1).not.toBe(hash2);
		});

		it('should include salt at front of hash', () => {
			const salt = 'testsalt';
			const hash = Crypto.passwordHash('mypassword', salt);
			expect(hash.substring(0, salt.length)).toBe(salt);
		});

		it('should handle empty text (saltStart = 0)', () => {
			const salt = Crypto.sha256('mysalt');
			// When text is empty, saltStart = 0, so we hit: else outHash = Crypto.sha256(salt + textHash)
			const hash = Crypto.passwordHash('', salt);
			expect(typeof hash).toBe('string');
			expect(hash.startsWith(salt)).toBe(true);
		});

		it('should handle text longer than salt (saltStart > salt.length - 1)', () => {
			// Salt is 64 chars (sha256 output), so text longer than 64 chars hits the else if
			const salt = Crypto.sha256('mysalt'); // 64 chars
			const longText = 'a'.repeat(100); // 100 chars > 64
			const hash = Crypto.passwordHash(longText, salt);
			expect(typeof hash).toBe('string');
			expect(hash.startsWith(salt)).toBe(true);
		});
	});

	describe('sha256 with extended UTF-8 characters', () => {
		it('should handle characters in range 128-2047 (2-byte UTF-8)', () => {
			// Characters with code points 128-2047 trigger the (c > 127) && (c < 2048) branch
			// Latin Extended characters: ©(169), ®(174), ñ(241), ü(252)
			const hash = Crypto.sha256('©®ñü');
			expect(typeof hash).toBe('string');
			expect(hash.length).toBe(64);
		});

		it('should handle mix of ASCII and extended characters', () => {
			// Mix of regular ASCII and 128-2047 range characters
			const hash = Crypto.sha256('Hello © World ® ñ');
			expect(typeof hash).toBe('string');
			expect(hash.length).toBe(64);
		});
	});

	describe('encryptAES256CBC and decryptAES256CBC', () => {
		it('should encrypt and decrypt string correctly', () => {
			const original = 'Hello, World!';
			const password = 'mySecretPassword';
			const encrypted = Crypto.encryptAES256CBC(original, password);
			const decrypted = Crypto.decryptAES256CBC(encrypted, password);
			expect(decrypted).toBe(original);
		});

		it('should encrypt and decrypt with salt', () => {
			const original = 'Secret message';
			const password = 'password123';
			const salt = 'mysalt';
			const encrypted = Crypto.encryptAES256CBC(original, password, salt);
			const decrypted = Crypto.decryptAES256CBC(encrypted, password, salt);
			expect(decrypted).toBe(original);
		});

		it('should generate different encrypted output each time', () => {
			const original = 'Same message';
			const password = 'password';
			const encrypted1 = Crypto.encryptAES256CBC(original, password);
			const encrypted2 = Crypto.encryptAES256CBC(original, password);
			// Should be different due to random IV
			expect(encrypted1).not.toBe(encrypted2);
		});

		it('should fail to decrypt with wrong password', () => {
			const original = 'Secret';
			const password = 'correct';
			const encrypted = Crypto.encryptAES256CBC(original, password);
			// Wrong password causes decipher.final() to throw
			expect(() => {
				Crypto.decryptAES256CBC(encrypted, 'wrong');
			}).toThrow();
		});

		it('should fail to decrypt with wrong salt', () => {
			const original = 'Secret';
			const password = 'password';
			const salt = 'correct';
			const encrypted = Crypto.encryptAES256CBC(original, password, salt);
			expect(() => {
				Crypto.decryptAES256CBC(encrypted, password, 'wrong');
			}).toThrow();
		});

		it('should handle empty string', () => {
			const original = '';
			const password = 'password';
			const encrypted = Crypto.encryptAES256CBC(original, password);
			const decrypted = Crypto.decryptAES256CBC(encrypted, password);
			expect(decrypted).toBe(original);
		});

		it('should handle special characters', () => {
			const original = 'Hello!@#$%^&*()_+-=[]{}|;:,.<>?';
			const password = 'password';
			const encrypted = Crypto.encryptAES256CBC(original, password);
			const decrypted = Crypto.decryptAES256CBC(encrypted, password);
			expect(decrypted).toBe(original);
		});
	});

	describe('encodeToken and decodeToken', () => {
		const scope = 'test-scope';
		const key = 'test-key-123';
		const host = 'example.com';
		const origin = 'https://example.com';
		const expire = 3600;
		const JWTKey = 'jwt-secret-key';
		const AESKey = 'aes-secret-key-32-characters!!';

		it('should encode and decode token correctly', () => {
			const token = Crypto.encodeToken(scope, key, host, origin, expire, JWTKey, AESKey);
			const decodedKey = Crypto.decodeToken(scope, token, JWTKey, AESKey);
			expect(decodedKey).toBe(key);
		});

		it('should throw error for wrong scope', () => {
			const token = Crypto.encodeToken(scope, key, host, origin, expire, JWTKey, AESKey);
			expect(() => {
				Crypto.decodeToken('wrong-scope', token, JWTKey, AESKey);
			}).toThrow('Unable to verify token scope');
		});

		it('should throw error for wrong JWT key', () => {
			const token = Crypto.encodeToken(scope, key, host, origin, expire, JWTKey, AESKey);
			expect(() => {
				Crypto.decodeToken(scope, token, 'wrong-jwt-key', AESKey);
			}).toThrow();
		});

		it('should throw error for wrong AES key', () => {
			const token = Crypto.encodeToken(scope, key, host, origin, expire, JWTKey, AESKey);
			expect(() => {
				Crypto.decodeToken(scope, token, JWTKey, 'wrong-aes-key');
			}).toThrow();
		});

		it('should include correct claims in token', () => {
			const token = Crypto.encodeToken(scope, key, host, origin, expire, JWTKey, AESKey);
			// Decrypt and decode to verify claims
			const decrypted = Crypto.decryptAES256CBC(token, AESKey);
			const decoded = JWT.decode(decrypted) as any;
			expect(decoded.iss).toBe(host);
			expect(decoded.aud).toBe(origin);
			expect(decoded.key).toBe(key);
			expect(decoded.scope).toBe(scope);
		});
	});
});

