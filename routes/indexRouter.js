const {Router} = require("express");
const {getRoot} = require('../controllers/indexController')

const indexRouter = Router();

indexRouter.get("/", getRoot);

module.exports = indexRouter;