const MiddleWareError = (functError) => {
  return (req, res, next) => {
    functError(req, res, next).catch((err) => {
      if (typeof next === "function") {
        next(err);
      } else {
        // Handle error differently for cron jobs or other contexts
        console.error(err);
      }
    });
  };
};
module.exports = MiddleWareError;
