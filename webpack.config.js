module.exports = {
    entry: {
        main: "./src/main.js",
        demo: "./src/xor-demo.js",
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