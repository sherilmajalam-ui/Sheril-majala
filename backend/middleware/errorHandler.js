// Catches any error passed to next(err) or thrown in async handlers
const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in request body" });
    }

    res.status(err.status || 500).json({
        message: err.status ? err.message : "Something went wrong on the server"
    });
};

// Wraps async controllers so thrown errors reach errorHandler
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
