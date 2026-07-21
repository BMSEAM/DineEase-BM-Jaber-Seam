// Provide required env vars before any module reads them during tests.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest_only';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/dineease_test_placeholder';
