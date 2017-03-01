const { resolve } = require('path')
const { readFileSync } = require('fs')

const Koa = require('koa')
const webpack = require('webpack')
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware')
const mount = require('koa-mount')
const serve = require('koa-static')
const getRouter = require('koa-router')

const webpackConfig = require('./webpack.config.dev')

// koa-webpack-middleware needs `regeneratorRuntime` as a global variable
// see /node_modules/koa-webpack-middleware/lib/devMiddleware.js
global.regeneratorRuntime = require('regenerator-runtime')

const app = new Koa()
const router = getRouter()
const compiler = webpack(webpackConfig)

app.use(devMiddleware(compiler, {
  // public path to bind the middleware to
  // use the same as in webpack
  publicPath: webpackConfig.output.publicPath,

  // options for formating the statistics
  stats: 'minimal',

  // enable HMR on the server
  hot: true
}))

app.use(hotMiddleware(compiler))

// set static folder
app.use(mount('/static', serve(resolve(__dirname, './static'))))

app.use(router.routes()).use(router.allowedMethods())

// send index.html for any path
router.get('*', ctx => {
  ctx.type = 'text/html; charset=utf-8'
  ctx.body = readFileSync(resolve(__dirname, './index.html'))
})

app.on('error', function (err) {
  console.error('server error', err)
})

app.listen(3000, () => {
  console.log('Listening at 🌏  http://localhost:3000/')
})
