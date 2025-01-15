const ReactCompilerConfig = {
    target: '18', // '17' | '18' | '19'
};

module.exports = function (api) {
    api.cache(false);
    return {
        plugins: [
            ['babel-plugin-react-compiler', ReactCompilerConfig], // must run first!
            '@babel/plugin-syntax-jsx',
        ],
    };
};