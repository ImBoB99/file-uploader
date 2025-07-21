const {Router} = require('express')
const foldersController = require("../controllers/foldersController")
const foldersRouter = Router();
const { isAuth } = require("../middleware/authMiddleware")

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

foldersRouter.get("/", isAuth, foldersController.getFolderRoot)

foldersRouter.post("/new-folder", isAuth, foldersController.postNewFolder)
foldersRouter.post("/upload", isAuth, upload.single('file'), foldersController.postNewFile)
foldersRouter.post("/delete/file/:fileId", isAuth, foldersController.postDeleteFile)
foldersRouter.post("/delete/folder/:folderId", isAuth, foldersController.postDeleteFolder)

foldersRouter.get("/file/*fileId", isAuth, foldersController.getFileById)
foldersRouter.get("/download/:fileId", isAuth, foldersController.downloadFileById);
foldersRouter.get("/*folderId", isAuth, foldersController.getFolderById)

module.exports = foldersRouter;