import path from 'path';
import fs from 'fs';

import spdy from 'spdy';
import Koa from 'koa';
import webpack from 'webpack';
import { devMiddleware, hotMiddleware } from 'koa-webpack-middleware';
import mount from 'koa-mount';
import convert from 'koa-convert';
import serve from 'koa-static';
import getRouter from 'koa-router';

import webpackConfig from './webpack.config.dev';

const app = new Koa();
const router = getRouter();
const compiler = webpack(webpackConfig);

app.use(devMiddleware(compiler, {
  // display no info to console (only warnings and errors)
  noInfo: true,

  // display nothing to the console
  quiet: false,

  // public path to bind the middleware to
  // use the same as in webpack
  publicPath: webpackConfig.output.publicPath,

  // options for formating the statistics
  stats: {
      colors: true,
  },
}));

app.use(hotMiddleware(compiler));

// set static folder
app.use(mount('/static', new Koa().use(convert(serve(path.join(__dirname, '/static'))))));

app.use(router.routes()).use(router.allowedMethods());

// send index.html for any path
router.get('*', ctx => {
  ctx.type = 'text/html; charset=utf-8';
  ctx.body = fs.readFileSync(path.join(__dirname, './index.html'));
});

app.on('error', function(err){
  console.error('server error', err);
});


const spdyOption = {
  // Private key
  key: fs.readFileSync(path.join(__dirname, './ssl/localhost.key')),

  // Fullchain file or cert file (prefer the former)
  cert: fs.readFileSync(path.join(__dirname, './ssl/localhost.crt')),

  // **optional** SPDY-specific options
  spdy: {
    protocols: ['h2', 'spdy/3.1', 'http/1.1'],
    plain: false,
    connection: {
      windowSize: 1024 * 1024, // Server's window size
      // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
      autoSpdy31: false,
    },
  },
};

spdy.createServer(spdyOption, app.callback()).listen(3000, err => {
  if(err) {
    console.log(err);
    return;
  }

  console.log('Listening at 🌏  https://localhost:3000');
})
