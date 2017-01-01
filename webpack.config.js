const CopyWebpackPlugin = require('copy-webpack-plugin')
const FlowWebpackPlugin = require('flow-webpack-plugin')

module.exports = {
    entry: {
        pmgr: ['babel-polyfill','./src/binding.js'],
        // the array parenthesis is a workaround - an entry point can't be a dependency of another endpoint
        core: ['babel-polyfill', './src/core.js']
    },
    output: {
        path: './dist',
        filename: "[name].bundle.js",
        publicPath: '/',
        libraryTarget: 'umd'
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
        new FlowWebpackPlugin(),
        new CopyWebpackPlugin([{
            from: 'page.html',
            force: true
        }])
    ],
    externals : ['$', 'window', 'gapi'],
    devtool: 'source-map',
    devServer: {
        inline: true,
        hot: true,
        contentBase: 'dist'
    }
};