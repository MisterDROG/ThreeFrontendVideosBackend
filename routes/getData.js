const router = require("express").Router();
const PostsModel = require("../models/post");

const allowedCors = ["http://localhost:3000", "http://localhost:4000"];

//route for checking CORS for frontend
router.use((req, res, next) => {
  const { origin } = req.headers;
  if (allowedCors.includes(origin)) {
    console.log("CORS ok");
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    console.log("wrong CORS");
    // res.header('Access-Control-Allow-Origin', '*')
    return;
  }
  next();
});

//route for getting posts from MongoDB for frontend
router.get("/", (req, res) => {
  PostsModel.find({})
    .then((posts) => {
      res.send(posts);
    })
    .then(() => console.log("Posts sended"))
    .catch((err) =>
      res.status(500).send({ message: `Error in sending posts: ${err}` })
    );
});

module.exports = router;
