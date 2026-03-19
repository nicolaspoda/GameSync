const router = require('./routes')
const { registerPuissance4Sockets } = require('./sockets')

module.exports = {
  puissance4Router: router,
  registerPuissance4Sockets,
}
