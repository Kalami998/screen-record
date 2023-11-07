const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
	mode: "production", // 环境
	// target: "web",
	entry: "./index.js", // 入口文件
	output: {
		path: path.resolve(__dirname, "./dist"), // 输出文件夹
		filename: "screen-record.min.js", // 文件名称
		libraryTarget: "umd", // 打包方式
		globalObject: "this", // 全局对象
		library: "screen-record", // 类库名称
	},
	module: {
		rules: [
			// 处理图片文件
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				use: [
					{
						// 使用 file-loader 加载
						loader: "file-loader",
						options: {
							// images 统一存放路径
							// [name]: 这是一个占位符，将被替换为源文件的名称（不包括文件扩展名）。
							// [ext]: 这是另一个占位符，将被替换为源文件的扩展名。
							name: "images/[name].[ext]",
						},
					},
				],
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(), // 清除上一次打包内容
	],
};
