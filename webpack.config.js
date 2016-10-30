module.exports = {
    entry: {
        browser: "./src/browser.js"
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
    }
};