const notFoundHandler = (req, res, next) => {
  const err = new Error("Page Not Found");
  err.statusCode = 404;
  next(err); // Pass it to global error handler
};


const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  if (statusCode === 404) {
    return res.status(404).render("404");
  }

  res.status(statusCode).render("500", { error: err, statusCode });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
