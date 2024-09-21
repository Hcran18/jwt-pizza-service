const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let testUserId;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
});

test("register missing required data", async () => {
  const res = await request(app).post("/api/auth").send({});
  expect(res.status).toBe(400);
  expect(res.body.message).toBe("name, email, and password are required");
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(typeof password).toBe("string");
  expect(loginRes.body.user).toMatchObject(user);
});

test("logout", async () => {
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe("logout successful");
});

test("updateUser", async () => {
  const updatedUser = { name: "new name", email: "test@test.com", password: "password" };
  const registerRes = await request(app).post("/api/auth").send(updatedUser);
  const updatedUserAuthToken = registerRes.body.token;
  const userId = registerRes.body.user.id;
  const updateInfo = { email: "new@test.com", password: "new password" };

  const updateUserRes = await request(app)
    .put(`/api/auth/${userId}`)
    .set("Authorization", `Bearer ${updatedUserAuthToken}`)
    .send(updateInfo);
  expect(updateUserRes.status).toBe(200);

  const { password, ...updatedUserWithoutPassword } = { ...updatedUser, ...updateInfo };
  expect(typeof password).toBe("string");
  expect(updateUserRes.body).toMatchObject(updatedUserWithoutPassword);
});
