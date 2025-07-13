const {Router} = require('express')
const foldersController = require("../controllers/foldersController")
const foldersRouter = Router();
const { isAuth } = require("../middleware/authMiddleware")

foldersRouter.get("/folders", isAuth, foldersController.getFoldersRoot)
foldersRouter.get("/folders/:folderId", isAuth, foldersController.getFolderById)

module.exports = foldersRouter;