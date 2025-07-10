const {Router} = require("express")
const userController = require("../controllers/userController")
const userRouter = Router();

userRouter.get("/register", userController.getRegister) //TODO:
userRouter.post("/register", userController.postRegister) //TODO:
userRouter.get("/login", userController.getLogin) //TODO:
// userRouter.post("/login", ) //TODO: passport.authenticate
// userRouter.post("/logout", ) //TODO: req.logout
 


module.exports = userRouter;