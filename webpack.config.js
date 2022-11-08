const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
	mode: "production", // 环境
	// target: "web",
	entry: "./index.js", // 入口文件
	output: {
		path: path.resolve(__dirname, "./dist"), // 输出文件夹
		filename: "screen-webrtc.min.js", // 文件名称
		libraryTarget: "umd", // 打包方式
		globalObject: "this", // 全局对象
		library: "screen-webrtc", // 类库名称
	},
	plugins: [
		new CleanWebpackPlugin(), // 清除上一次打包内容
	],
};
