const {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  deleteFavorites,
} = require("./db");

const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.send(await fetchFavorites(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/users/:user_id/favorites/:id", async (req, res, next) => {
  try {
    await deleteFavorites({ user_id: req.params.user_id, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.status(201).send(
      await createFavorite({
        user_id: req.params.id,
        favorite_id: req.body.product_id,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");
  const [travis, drake, lebron, basketball, football, baseball] =
    await Promise.all([
      createUser({ username: "travis", password: "cool" }),
      createUser({ username: "drake", password: "cool" }),
      createUser({ username: "lebron", password: "cool" }),
      createProduct({ name: "basketball" }),
      createProduct({ name: "football" }),
      createProduct({ name: "baseball" }),
    ]);

  console.log("Here are your users", await fetchUsers());
  console.log("Here are your products", await fetchProducts());

  const favorites = await Promise.all([
    createFavorite({ user_id: travis.id, product_id: basketball.id }),
    createFavorite({ user_id: travis.id, product_id: football.id }),
    createFavorite({ user_id: drake.id, product_id: football.id }),
  ]);
  console.log("here's your favorites", favorites);

  await deleteFavorites({ user_id: travis.id, id: favorites[0].id });
  console.log("favorite destroyed", await fetchFavorites(travis.id));

  console.log(`curl localhost:3000/api/users/${drake.id}/favorites`);
  console.log(
    `curl -X POST localhost:3000/api/users/${drake.id}/favorites -d '{"product_id":"${baseball.id}"}' -H 'Content-Type:application/json'`
  );
  console.log(
    `curl -X DELETE localhost:3000/api/users/${drake.id}/favorites/${favorites[0].id}`
  );

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server is serving port: ${port}`));
};
init();
