'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeModulesPath = path.join(__dirname, 'node_modules/');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: isProduction
        ? 'source-map'
        : 'inline-source-map',

    entry: (isProduction ? [] : [
        'react-hot-loader/patch',
        'webpack-dev-server/client?http://localhost:3000',
        'webpack/hot/only-dev-server',
    ]).concat([
        path.join(__dirname, 'app/index.js'),
    ]),

    output: {
        filename: isProduction
            ? '[name]-[chunkhash].js'
            : '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    'env',
                                    isProduction ? {
                                        targets: {
                                            browsers: 'last 2 versions',
                                        },
                                    } : {
                                        targets: {
                                            chrome: 60,
                                        },
                                        include: [
                                            'transform-es2015-classes',
                                        ],
                                    },
                                ],
                                'stage-2',
                                'react',
                            ],
                            plugins: isProduction ? [] : [
                                'react-hot-loader/babel',
                            ],
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.json?$/,
                use: [
                    'json-loader',
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            //modules: true,
                            //localIdentName: '[local]'
                            //localIdentName: '[name]---[local]---[hash:base64:5]'
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.(jpg|png|svg)$/,
                loader: 'url-loader',
                options: {
                    limit: 2000,
                },
            },
        ],
    },

    plugins: [
        isProduction ? new UglifyJsPlugin({
            sourceMap: true,
            uglifyOptions: {
                ecma: 8,
            },
        }) : null,

        isProduction ? null : new webpack.HotModuleReplacementPlugin(),
        isProduction ? null : new webpack.NamedModulesPlugin(),
        isProduction ? null : new webpack.NoEmitOnErrorsPlugin(),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'node-static',
            minChunks(module) {
                var context = module.context;
                return context && context.startsWith(nodeModulesPath);
            },
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest',
            filename: isProduction
                ? undefined
                : 'manifest.js',
        }),

        new HtmlWebpackPlugin({
            inject: true,
            filename: 'index.html',
            template: path.join(__dirname, 'index.ejs'),
            config: {
                //gitCommitHash: process.env.GIT_COMMIT_HASH,
            },
        }),

        // new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
        //     analyzerMode: 'static',
        // }),

    ].filter(Boolean),
};

if (!isProduction) {
    module.exports.devServer = {
        host: 'localhost',
        port: 3000,

        historyApiFallback: true,
        // respond to 404s with index.html

        hot: true,
        // enable HMR on the server
    };
}
