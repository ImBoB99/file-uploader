require("dotenv").config({quiet: true});
const express = require("express");
const path = require("node:path");
const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const indexRouter = require("./routes/indexRouter");
const userRouter = require("./routes/userRouter");
const foldersRouter = require("./routes/foldersRouter");
const passport = require("passport");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");
const prisma = require("./db/prismaClient")

// Need to require the entire Passport config module so app.js knows about it
require("./config/passport");

const app = express();

app.use(
  session({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);

app.use(passport.session())

// globally set the currentUser variable so every ejs view has access
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/", userRouter);
app.use("/", foldersRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.APP_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
