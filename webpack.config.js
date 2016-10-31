const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        pmgr: "./src/binding.js"
    },
    output: {
        path: './dist',
        filename: "[name].bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ],
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: 'page.html'
        }])
    ],
    externals : '$',
    devtool: 'source-map'
};