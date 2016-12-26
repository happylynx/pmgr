const CopyWebpackPlugin = require('copy-webpack-plugin')
const FlowStatusWebpackPlugin = require('flow-status-webpack-plugin')

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
        loaders: [ // TODO add flow-bin-loader
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ],
    },
    plugins: [
        // TODO fix error printing when flow is not found, fix searching for flow, add logging - "running flow"
        // TODO check multiple compilations
        // TODO webpack fail on error - return code
        new FlowStatusWebpackPlugin({
            failOnError: true
        }),
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