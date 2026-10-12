import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Web3 Jobs API', () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();
  const login = async (email: string) =>
    `Bearer ${(await request(server()).post('/api/auth/login').send({ email, password: 'Demo1234' })).body.token}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api', async () => {
    const res = await request(server()).get('/api');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });

  it('GET /api/work/list', async () => {
    const res = await request(server()).get('/api/work/list');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
  });

  it('lists jobs with pagination, filters and sorting', async () => {
    const all = await request(server()).get('/api/jobs?pageSize=5');
    expect(all.body.list).toHaveLength(5);
    expect(all.body.total).toBeGreaterThan(5);
    expect(all.body.list[0].company.name).toBeTruthy();

    const remote = await request(server()).get('/api/jobs?workMode=remote&category=智能合约');
    expect(remote.body.list.every((j: any) => j.workMode === 'remote' && j.category === '智能合约')).toBe(true);

    const keyword = await request(server()).get('/api/jobs?keyword=solidity&sort=relevance');
    expect(keyword.body.list[0].title).toMatch(/Solidity/);

    const salary = await request(server()).get('/api/jobs?sort=salary');
    const maxes = salary.body.list.map((j: any) => j.salaryMax);
    expect([...maxes].sort((a, b) => b - a)).toEqual(maxes);

    const none = await request(server()).get('/api/jobs?keyword=zzzz-nothing');
    expect(none.body.total).toBe(0);
  });

  it('returns job detail and related jobs, 404 for unknown / unpublished', async () => {
    expect((await request(server()).get('/api/jobs/1')).body.title).toMatch(/Solidity/);
    expect((await request(server()).get('/api/jobs/1/related')).body.list.length).toBeGreaterThan(0);
    expect((await request(server()).get('/api/jobs/999')).status).toBe(404);
    expect((await request(server()).get('/api/jobs/13')).status).toBe(404);
  });

  it('validates registration and login', async () => {
    const bad = await request(server()).post('/api/auth/register').send({ email: 'nope', password: 'x', name: 'a', role: 'candidate' });
    expect(bad.status).toBe(400);
    const ok = await request(server())
      .post('/api/auth/register')
      .send({ email: 'new@user.com', password: 'Passw0rd1', name: 'New', role: 'candidate' });
    expect(ok.status).toBe(201);
    const dup = await request(server())
      .post('/api/auth/register')
      .send({ email: 'new@user.com', password: 'Passw0rd1', name: 'New', role: 'candidate' });
    expect(dup.status).toBe(409);
    const wrong = await request(server()).post('/api/auth/login').send({ email: 'candidate@demo.com', password: 'wrongpass1' });
    expect(wrong.status).toBe(401);
  });

  it('supports favorites and applying (with duplicate protection)', async () => {
    const auth = await login('candidate@demo.com');
    expect((await request(server()).post('/api/jobs/2/favorite')).status).toBe(401);
    await request(server()).post('/api/jobs/2/favorite').set('Authorization', auth).expect(201);
    const favs = await request(server()).get('/api/users/favorites').set('Authorization', auth);
    expect(favs.body.ids).toContain(2);
    await request(server()).delete('/api/jobs/2/favorite').set('Authorization', auth).expect(200);

    const applied = await request(server()).post('/api/jobs/2/apply').set('Authorization', auth).send({});
    expect(applied.status).toBe(201);
    const again = await request(server()).post('/api/jobs/2/apply').set('Authorization', auth).send({});
    expect(again.status).toBe(409);
  });

  it('runs the employer → admin review flow', async () => {
    const employer = await login('employer@demo.com');
    const admin = await login('admin@demo.com');
    const candidate = await login('candidate@demo.com');
    const payload = {
      title: 'Test Engineer', description: 'desc', location: 'Remote', category: 'DeFi',
      jobType: 'full-time', workMode: 'remote', experience: 'mid', salaryMin: 1000, salaryMax: 2000,
      skills: ['Testing'], responsibilities: ['a'], requirements: ['b'], benefits: ['c'],
    };
    expect((await request(server()).post('/api/employer/jobs').set('Authorization', candidate).send(payload)).status).toBe(403);
    expect((await request(server()).post('/api/employer/jobs').set('Authorization', employer).send({ ...payload, salaryMax: 1 })).status).toBe(400);

    const created = await request(server()).post('/api/employer/jobs').set('Authorization', employer).send(payload);
    expect(created.status).toBe(201);
    const id = created.body.job.id;
    expect((await request(server()).get(`/api/jobs/${id}`)).status).toBe(404);

    expect((await request(server()).post(`/api/admin/jobs/${id}/review`).set('Authorization', employer).send({ decision: 'approved' })).status).toBe(403);
    await request(server()).post(`/api/admin/jobs/${id}/review`).set('Authorization', admin).send({ decision: 'approved' }).expect(201);
    expect((await request(server()).get(`/api/jobs/${id}`)).status).toBe(200);

    await request(server()).post(`/api/employer/jobs/${id}/offline`).set('Authorization', employer).expect(201);
    expect((await request(server()).get(`/api/jobs/${id}`)).status).toBe(404);
  });

  it('exposes admin stats and employer applications', async () => {
    const admin = await login('admin@demo.com');
    const employer = await login('employer@demo.com');
    expect((await request(server()).get('/api/admin/stats').set('Authorization', admin)).body.jobsLive).toBeGreaterThan(0);
    const apps = await request(server()).get('/api/employer/applications').set('Authorization', employer);
    expect(apps.body.total).toBeGreaterThan(0);
  });
});
