module.exports = async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) throw {status: 404, message: 'Not found'}
  } catch (err) {
    if (err.status >= 500 || !err.status) console.log('Error handler:', err);
    ctx.status = err.status || 500;
    ctx.body = {
      status: 'failed',
      message: err.message || 'Internal server error',
    };
  }
};
