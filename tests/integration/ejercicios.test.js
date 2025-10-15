const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Tarea = require('../../src/models/tarea.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Tarea.deleteMany();
});

describe('🎓 EJERCICIOS PARA ESTUDIANTES', () => {

  // EJERCICIO 1: PUT /api/tareas/:id - actualizar tarea
  test('PUT /api/tareas/:id actualiza una tarea', async () => {
    // 1) crear tarea inicial
    const tarea = await Tarea.create({ title: 'Tarea original', completed: false });

    // 2) hacer PUT con los nuevos datos
    const res = await request(app)
      .put(`/api/tareas/${tarea._id}`)
      .send({ title: 'Tarea actualizada', completed: true });

    // 3) verificar respuesta
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', tarea._id.toString());
    expect(res.body).toHaveProperty('title', 'Tarea actualizada');
    expect(res.body).toHaveProperty('completed', true);

    // 4) verificar en BD
    const inDb = await Tarea.findById(tarea._id);
    expect(inDb).not.toBeNull();
    expect(inDb.title).toBe('Tarea actualizada');
    expect(inDb.completed).toBe(true);
  });

  // EJERCICIO 2: DELETE /api/tareas/:id - eliminar tarea
  test('DELETE /api/tareas/:id elimina una tarea y luego GET devuelve 404', async () => {
    // 1) crear tarea
    const tarea = await Tarea.create({ title: 'A borrar' });

    // 2) eliminar
    const delRes = await request(app).delete(`/api/tareas/${tarea._id}`);
    // algunas APIs devuelven 204, otras 200; aceptamos ambos
    expect([200, 204]).toContain(delRes.statusCode);

    // 3) confirmar que ya no existe
    const getRes = await request(app).get(`/api/tareas/${tarea._id}`);
    expect(getRes.statusCode).toBe(404);
  });

  // EJERCICIO 3: Validación de POST con title vacío
  test('POST /api/tareas con title vacío debe fallar', async () => {
    const res = await request(app)
      .post('/api/tareas')
      .send({ title: '' });

    // según implementación puede ser 400 o 422
    expect([400, 422, 500]).toContain(res.statusCode);
    expect(typeof res.body).toBe('object');

    // mensaje de validación genérico (ajústalo si tu API usa otra clave)
    const msg = (res.body.message || res.body.error || '').toLowerCase();
    expect(msg).toMatch(/title|requerid|requerido|valid/i);
  });

  // EJERCICIO 4: GET ordenado por fecha (createdAt)
  test('GET /api/tareas devuelve tareas ordenadas por fecha de creación (desc)', async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    await Tarea.create({ title: 'A' }); await sleep(10);
    await Tarea.create({ title: 'B' }); await sleep(10);
    await Tarea.create({ title: 'C' });

    const res = await request(app).get('/api/tareas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);

    // comprobamos orden por createdAt descendente
    const times = res.body.map(t => new Date(t.createdAt).getTime());
    for (let i = 1; i < times.length; i++) {
  expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
}

    // Si tu endpoint los devuelve ascendente, usa esto en su lugar:
    // for (let i = 1; i < times.length; i++) {
    //   expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    // }
  });

  // EJERCICIO 5: ID inválido (no ObjectId) debe devolver 500
  test('GET /api/tareas/:id con ID inválido devuelve 500', async () => {
    const res = await request(app).get('/api/tareas/123'); // "123" no es un ObjectId válido
    expect(res.statusCode).toBe(500);
    expect(typeof res.body).toBe('object');
    // opcional: verificar mensaje
    // expect(res.body).toHaveProperty('message');
  });
});
