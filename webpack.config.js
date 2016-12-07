const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        pmgr: './src/binding.js',
        // the array parenthesis is a workaround - an entry point can't be a dependency of another endpoint
        crypto: ['./src/browser.js']
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