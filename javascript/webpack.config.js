// webpack.config.js
const webpack = require("webpack");
var nodeExternals = require('webpack-node-externals');

module_rules = {
    rules: [{
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
    },
    {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
    }]
}

module.exports = [
{
    mode: "development",
    entry: __dirname + "/soundnovel.ts",
    output: { 
        path: __dirname, 
        filename: "soundnovel.js"
    },
    target: "electron-main",
    module: module_rules,
    externals: [nodeExternals()],
    resolve: {
        extensions: [".ts"]
    },
},
{
    mode: "development",
    entry: __dirname + "/ui/index.ts",
    output: {
        path: __dirname + "/ui", 
        filename: "index.js"
    },
    target: "electron-renderer",
    module: module_rules,
    resolve: {
        extensions: [".ts"]
    }
}
];