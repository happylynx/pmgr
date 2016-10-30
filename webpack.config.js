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
        ]
    },
    externals : '$',
    devtool: 'source-map'
};