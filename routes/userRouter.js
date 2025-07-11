const {Router} = require("express")
const userController = require("../controllers/userController")
const userRouter = Router();
const passport = require("passport")
const { signupValidation } = require("../middleware/userSignupValidation");
const { isAuth } = require("../middleware/authMiddleware")
const multer = require("multer")
const upload = multer({dest: "uploads/"})

userRouter.get("/register", userController.getRegister)
userRouter.post("/register", signupValidation, userController.postRegister)
userRouter.get("/login", userController.getLogin)
userRouter.post("/login", passport.authenticate("local", {
  successRedirect: "/login",
  failureRedirect: "/login"
}))
userRouter.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error)
    }

    res.redirect("/login")
  })
})
userRouter.get("/upload", isAuth, userController.getUpload)
userRouter.post("/upload", isAuth, upload.single('avatar'), userController.postUpload)
 


module.exports = userRouter;