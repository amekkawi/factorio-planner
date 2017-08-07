const path = require('path');
const webpack = require('webpack');

const base = require('./webpack.config.js');

module.exports = {
    devtool: 'source-map',

    entry: path.join(__dirname, 'app/index.js'),

    output: {
        filename: 'static/bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },

    resolve: base.resolve,
    module: base.module,

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            comments: false,
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
    ],
};
