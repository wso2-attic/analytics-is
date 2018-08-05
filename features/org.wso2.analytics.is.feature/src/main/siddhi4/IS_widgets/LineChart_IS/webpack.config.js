const path = require('path');
const webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        index: './LineChart_IS.jsx'
    },
    output: {
        path: path.resolve(__dirname, './dist/LineChart_IS/'),
        filename: 'LineChart_IS.js'
    },
    module: {
        loaders: [
            {
                test: /\.html$/,
                use: [{loader: 'html-loader'}]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: ['es2015', 'react']
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|svg|cur|gif|eot|svg|ttf|woff|woff2)$/,
                use: ['url-loader']
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'sass-loader'}]
            }

        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: path.resolve(__dirname, './src/resources/')}
        ])
    ],
    resolve: {
        extensions: ['.js', '.json', '.jsx', '.scss']
    },
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        publicPath: '/dist/'
    },
    externals: {
        react: 'React'
    }
};
