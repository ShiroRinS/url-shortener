const request = require('supertest');
const app = require('../src/index');

jest.mock('../src/redis', () => ({
  set: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue('https://example.com'),
}));

const redis = require('../src/redis');

describe('URL Shortener API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue('https://example.com');
  });

  // --- basic tests (pass on main) ---

  test('POST /shorten with valid URL returns 200 with code and short fields', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('short');
  });

  test('POST /shorten with invalid URL returns 400', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid URL' });
  });

  test('GET /:code when found returns 302', async () => {
    const res = await request(app).get('/abc123');

    expect(res.status).toBe(302);
  });

  test('GET /:code when not found returns 404', async () => {
    redis.get.mockResolvedValueOnce(null);

    const res = await request(app).get('/notfound');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  // --- feature A: custom code (FAIL on main, pass after merge) ---

  test('POST /shorten with customCode returns code equal to customCode', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com', customCode: 'mylink' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('mylink');
  });

  test('POST /shorten with customCode "MyLink" returns code "mylink" (lowercased)', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com', customCode: 'MyLink' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('mylink');
  });

  // --- feature C: case insensitive (FAIL on main, pass after merge) ---

  test('GET /ABC123 calls redis.get with lowercase "abc123"', async () => {
    redis.get.mockResolvedValue('https://example.com');

    const res = await request(app).get('/ABC123');

    expect(res.status).toBe(302);
    expect(redis.get).toHaveBeenCalledWith('abc123');
  });
});
