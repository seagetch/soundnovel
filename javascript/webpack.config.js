// webpack.config.js
const webpack = require("webpack");
var nodeExternals = require('webpack-node-externals');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = [
{
    mode: "development",
    entry: __dirname + "/src/main/soundnovel.ts",
    output: { 
        path: __dirname, 
        filename: "soundnovel.js"
    },
    target: "electron-main",
    module: {
        rules: [
            { test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader'},
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
        ]
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: [nodeExternals()]
},
{
    mode: "development",
    entry: __dirname + "/src/ui/index.ts",
    output: {
        path: __dirname, 
        filename: "index.js"
    },
    target: "electron-renderer",
    module: {
        rules: [
            { test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader', options: { appendTsSuffixTo: [/\.vue$/] }},
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',},
            { test: /\.vue$/, loader: 'vue-loader'}
        ]
    },
    resolve: {
        extensions: ['.ts']
    },
    plugins: [
        new VueLoaderPlugin()
    ]
}
];