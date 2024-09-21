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
  return res.body.token;
}

async function createFranchise() {
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: randomName(), admins: [{ email: adminUser.email }] });
  return res.body.id;
}

beforeAll(async () => {
  adminUser = await createAdminUser();
  token = await login(adminUser);
});

test("get all franchises", async () => {
  const franchiseID = await createFranchise();
  const res = await request(app).get("/api/franchise");
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body.some((franchise) => franchise.id === franchiseID)).toBe(true);
});
