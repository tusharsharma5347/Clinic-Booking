const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test-appointment-booking');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      };
      await request(app).post('/api/register').send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Create and login a user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      };
      
      const registerResponse = await request(app).post('/api/register').send(userData);
      userId = registerResponse.body.data.user.id;
      
      const loginResponse = await request(app).post('/api/login').send({
        email: userData.email,
        password: userData.password
      });
      token = loginResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('id', userId);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});
