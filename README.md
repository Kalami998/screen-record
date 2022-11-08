### 测试插件
```
npm pack
```
- npm pack 之后，会在当前目录下生成一个 xx-btn-1.0.0.tgz 的文件。
- 打开一个项目，将压缩文件放到项目某个目录下，执行命令
- npm install 路径\xx-btn-1.0.0.tgz
- 路径是指压缩包所在的绝对路径，文件名必须是压缩包的全名

# 打包
```
webpack
```

### 在页面中调用
import {
    init,
    startRecord,
    stopRecord,
    download,
    downloadPart,
    getBlobData
} from "fe-webrtc"

## 初始化注册方法
init

```
init方法可传入一个初始化对象 defaultData 包括以下属性
{

    # 音频码率 默认 128000
    audioBitsPerSecond
        
    # 视频码率 默认 2500000
    videoBitsPerSecond 
    
    # 指定录制类型 不传默认是设备支持的第一个视频类型
    mimeType

    # 录制的最小字节数 默认 1024
    videoSize  

    # 媒体流设置 默认 { audio: true,video: true}
    constants

    # 输出视频格式 不传默认是设备支持的第一个视频类型
    outputType

    # 是否渲染自带样式 默认false
    noRender
}
```


## 获取当前设备支持录制的视频格式
getSupports
## 开始共享屏幕
startRecord
## 结束共享
stopRecord
## 下载整片视频
download
## 下载分片视频
downloadPart
## 获取录制下的blob数据(promise形式返回)
getBlobData