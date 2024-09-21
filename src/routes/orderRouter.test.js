const request = require("supertest");
const app = require("../service");
const { DB, Role } = require("../database/database.js");

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
  console.log(res.body);
  return res.body.token;
}

test("add item to menu", async () => {
  const adminUser = await createAdminUser();
  const adminToken = await login(adminUser);

  const item = {
    title: "Student",
    description: "No topping, no sauce, just carbs",
    image: "pizza9.png",
    price: 0.0001,
  };
  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminToken}`)
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
