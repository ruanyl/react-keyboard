const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('webpack-merge')

const pkg = require('./package.json')
const vendor = Object.keys(pkg.dependencies)

const ENV = process.env.NODE_ENV

/* eslint-disable max-len */
const common = {
  entry: {
    app: ['./index'],
    vendor,
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'static/[name].[hash].js',
    publicPath: '/',
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin('static/style.[hash].css', { allChunks: true }),
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: true,
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        include: __dirname,
      },
      {
        test: /\.scss/,
        loader: ExtractTextPlugin.extract(
          'style',
          'css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss!sass?sourceMap'
        ),
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: 'static/img/[name].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: 'static/fonts/[name].[ext]',
        },
      },
    ],
  },

  postcss: [
    require('autoprefixer'),
  ],
}

if (ENV === 'development') {
  module.exports = merge.smart(common, {
    debug: true,
    devtool: 'cheap-module-eval-source-map',
    entry: {
      app: ['webpack-hot-middleware/client'],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"',
      }),
    ],
  })
} else {
  module.exports = merge.smart(common, {
    debug: false,
    devtool: 'hidden-source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
      }),
    ],
  })
}
