import { authenticateUser } from '../../controllers/authController';

describe('authController', () => {
	test('should authenticate user with valid credentials', async () => {
		const credentials = { username: 'testUser', password: 'testPass' };
		const result = await authenticateUser(credentials);
		expect(result).toBeTruthy();
	});

	test('should not authenticate user with invalid credentials', async () => {
		const credentials = { username: 'wrongUser', password: 'wrongPass' };
		const result = await authenticateUser(credentials);
		expect(result).toBeFalsy();
	});
});