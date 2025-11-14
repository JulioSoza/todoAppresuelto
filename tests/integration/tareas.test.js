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

describe('EJEMPLOS PRACTICOS DE PRUEBAS DE INTEGRACION', () => {

  // EJERCICIO 1: Implementar la prueba para crear una tarea
  test('TODO: POST /api/tareas crea una tarea', async () => {
    // PISTA:
    // 1. Define el objeto `nuevaTarea` con el `title`.
    const newTask = {
        title: 'Tarea de prueba'
    };
    // 2. Haz una petición `POST` usando `supertest`.
    const res = await request(app)
    .post('/api/tareas')
    .send(newTask);
    // 3. Verifica el `statusCode` de la respuesta (debe ser 201).
    expect(res.statusCode).toBe(201);
    // 4. Asegúrate de que el cuerpo de la respuesta contenga el título y un `_id`.
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe(newTask.title);
    expect(res.body.title).toBe('Tarea de prueba');

    const tareaInDB = await Tarea.find();
    console.log("👨🏻‍💻 Revisión de datos creados en la prueba",tareaInDB);
  });

  // EJERCICIO 2: Implementar la prueba para obtener todas las tareas
  test('TODO: GET /api/tareas devuelve todas las tareas', async () => {
    // PISTA:
    // 1. Crea varias tareas directamente en la base de datos usando `Tarea.create()`.
    await Tarea.create({ title: 'Tarea 1'});
    await Tarea.create({ title: 'Tarea finalizada', completed: true });
    
    // 2. Haz una petición `GET` a la API.
    const res = await request(app)
    .get('/api/tareas');
    // 3. Verifica el `statusCode` (200) y que el array devuelto tenga la longitud correcta.
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body).toHaveLength(2);
    // 4. Asegúrate de que los títulos de las tareas en la respuesta coincidan con los que creaste.
    expect(res.body[0].title).toBe('Tarea 1');
    expect(res.body[1].title).toBe('Tarea finalizada');

    const TareaInDB = await Tarea.find();
    console.log("👨🏻‍💻 GET - Revisión de datos en la BD antes de la prueba",TareaInDB);
  });

 // EJERCICIO 3: Implementar la prueba para obtener una tarea específica
test('GET /api/tareas/:id devuelve una tarea específica', async () => {

    const tarea = await Tarea.create({ title: 'Tarea específica',completed:false });

    

    const res = await request(app)

      .get('/api/tareas/' + tarea._id);

    

    expect(res.statusCode).toBe(200);

    expect(res.body.title).toBe('Tarea específica');

    expect(res.body.completed).toBe(false);

  });


  // ✅ EJERCICIO 4: Implementar la prueba para un ID inexistente
test('GET /api/tareas/:id devuelve 404 para un ID inexistente', async () => {
  // 1) ID válido, pero que no existe
  const inexistente = new mongoose.Types.ObjectId(); // ID en blanco

  // 2) GET con ese ID
  const res = await request(app).get(`/api/tareas/${inexistente}`);

  // 3) Debe ser 404
  expect(res.statusCode).toBe(404);
  // mensaje de error genérico
  expect(typeof res.body).toBe('object');
});


// EJERCICIO 5: Implementar la prueba para un campo requerido
test('POST /api/tareas valida campos requeridos', async () => {
  // 1) Enviar body inválido (sin title o title vacío)
  const res = await request(app)
    .post('/api/tareas')
    .send({}); 

  // 2) Verificar status de error y mensaje de validación
  expect(res.statusCode).toBe(500);           //  acorde al comportamiento actual
  expect(res.body).toHaveProperty('error');   // el controlador devuelve { error: err.message }
  expect(typeof res.body.error).toBe('string'); // .toBe('Mensaje de error');
});

// EJERCICIO 6: Implementar la prueba para una lista vacía
test('GET /api/tareas devuelve un array vacío cuando no hay tareas', async () => {
  // afterEach ya limpia la BD, así que aquí debería estar vacía
  const res = await request(app).get('/api/tareas');

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(0);
});
});
