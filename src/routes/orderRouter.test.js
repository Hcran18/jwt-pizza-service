const request = require("supertest");
const app = require("../service");
const { DB, Role } = require("../database/database.js");

let adminUser;
let token;
let franchiseId;
let storeId;

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await DB.addUser(user);

  user.password = "toomanysecrets";
  return user;
}

async function login(user) {
  const res = await request(app).put("/api/auth").send(user);
  return res.body.token;
}

async function getMenuID() {
  const res = await request(app).get("/api/order/menu");
  if (res.body.length === 0) {
    return null;
  }
  return res.body[0].id;
}

async function createFranchise() {
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: randomName(), admins: [{ email: adminUser.email }] });
  return res.body.id;
}

async function createStore() {
  const res = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set("Authorization", `Bearer ${token}`)
    .send({ franchiseId: franchiseId, name: randomName() });
  return res.body.id;
}

beforeAll(async () => {
  adminUser = await createAdminUser();
  token = await login(adminUser);
  franchiseId = await createFranchise();
  storeId = await createStore();
});

test("add item to menu", async () => {
  const item = {
    title: "Student",
    description: "No topping, no sauce, just carbs",
    image: "pizza9.png",
    price: 0.0001,
  };
  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${token}`)
    .send(item);
  expect(res.status).toBe(200);
});

test("add item to menu as non-admin", async () => {
  const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
  const registerRes = await request(app).post("/api/auth").send(testUser);
  const token = registerRes.body.token;

  const item = {
    title: "Student",
    description: "No topping, no sauce, just carbs",
    image: "pizza9.png",
    price: 0.0001,
  };
  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${token}`)
    .send(item);
  expect(res.status).toBe(403);
});

test("get menu", async () => {
  const res = await request(app).get("/api/order/menu");
  expect(res.status).toBe(200);
  body = res.body;

  for (let item of body) {
    expect(item).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        image: expect.any(String),
        price: expect.any(Number),
        description: expect.any(String),
      })
    );
  }
});

test("create order", async () => {
  const menuID = await getMenuID();
  const item = {
    franchiseId: franchiseId,
    storeId: storeId,
    items: [{ menuId: menuID, description: "Veggie", price: 0.05 }],
  };

  const res = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${token}`)
    .send(item);
  expect(res.status).toBe(200);

  for (let item of res.body.order.items) {
    expect(item).toEqual(
      expect.objectContaining({
        menuId: expect.any(Number),
        description: expect.any(String),
        price: expect.any(Number),
      })
    );
  }
});
