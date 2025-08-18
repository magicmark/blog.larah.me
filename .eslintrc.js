module.exports = {
  extends: [
    "react-app",
  ],
  rules: {
    // Add any custom rules here
  },
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ["@babel/preset-react"],
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
