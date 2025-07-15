const {Router} = require('express')
const foldersController = require("../controllers/foldersController")
const foldersRouter = Router();
const { isAuth } = require("../middleware/authMiddleware")

foldersRouter.get("/", isAuth, foldersController.getFolderRoot)
foldersRouter.get("/*folderId", isAuth, foldersController.getFolderById)

foldersRouter.post("/new-folder", isAuth, foldersController.postNewFolder)

module.exports = foldersRouter;