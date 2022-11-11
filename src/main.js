// 获取视频流信息
var constants;

// 设置录制的视频流属性
var mediaOptions;

//用于录制视频
var mediaRecord;

// 用于记录整段视频
var recordWhole;

//视频流
var mediaStream;

// 录制开始时间
var startTime = 0;

// 录制倒计时
var recordTimer = null;

// 录制时长
var recordTimes = "00:00";

// 录制样式变化的倒计时
var btnTimeout = null;

var recordTimes = "00:00";

//保存整段视频数据
var chunks = [];

//用于记录某段视频视频
var partChunks = [];

// 支持的视频类型
var supportedList = [];

// 记录视频流数据的录入限制
var videoSize;

// 视频展示区
var videoLive;

var videoPreview;

// 视频输出方式
var outputType = "";

// 倒计时
var countdown = null;

// 录制
var countTime = 0;

// 悬浮样式
var swtich = false;

// 视频下载方式 一次性下载 one 间隔下载 more
var recordType;

// 主体
var content = null;

// 插件初始化
async function init(defaultData = "") {
    await getSupports();

    mediaOptions = {
        // 音频码率
        audioBitsPerSecond: defaultData.audioBitsPerSecond || 128000,
        // 视频码率
        videoBitsPerSecond: defaultData.videoBitsPerSecond || 2500000,
        // 指定类型
        mimeType: defaultData.mimeType || supportedList[0] || "video/webm"
    };

    videoSize = defaultData.videoSize || 1024;

    constants = defaultData.constants || {
        audio: true,
        video: true
    };

    if (defaultData.outputType) {
        outputType = defaultData.outputType;
    }

    // 渲染自生样式 不需要noRender参数传入true即可
    if (!defaultData.noRender) {
        content = null;
        render();
    }

    // 页面卸载去除倒计时
    addListeners();

    // 视频展示区
    videoLive = document.getElementById("live");
    videoPreview = document.getElementById("preview");
}

// 获取当前支持的录制类型
function getSupports() {
    const media = "video";
    // 常用的视频格式
    const types = [
        "webm",
        "mp4",
        "ogg",
        "mov",
        "avi",
        "wmv",
        "flv",
        "mkv",
        "ts",
        "x-matroska"
    ];

    // 常用的视屏编码
    const codecs = [
        "vp9",
        "vp9.0",
        "vp8",
        "vp8.0",
        "avc1",
        "av1",
        "h265",
        "h264"
    ];

    // 返回布尔值来表示是否支持
    const isSupportted = MediaRecorder.isTypeSupported;

    // 支持的结果
    const supported = [];

    // 遍历类型，排列组合
    types.forEach(type => {
        const mimeType = `${media}/${type}`;
        codecs.forEach(codec => {
            [
                `${mimeType};codecs=${codec}`,
                `${mimeType};codecs=${codec.toUpperCase()}`
            ].forEach(variation => {
                if (isSupportted(variation)) supported.push(variation);
            });
        });

        if (isSupportted(mimeType)) supported.push(mimeType);
    });

    supportedList = supported;

    // console.log("fe-wecrtc support--", supportedList);
}

// 添加一些页面监听事件
function addListeners() {
    // hash 模式
    window.addEventListener("hashchange", event => {
        clearCurrentInterval();
        if (content) {
            document.body.removeChild(content);
            content = null;
        }
    });

    // history模式
    window.addEventListener("popstate", event => {
        clearCurrentInterval();
        if (content) {
            document.body.removeChild(content);
            content = null;
        }
    });
}

/**
 * 开始录屏
 */
async function startRecord() {
    // navigator.mediaDevices.getDisplayMedia 只支持localhost 或者 https 调用
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert(
            "当前浏览器不支持屏幕捕捉或是当前访问头不支持使用navigator.mediaDevices"
        );
        return;
    }

    reset();

    //获取视频流，这时候会弹出用户选择框，前提用户设备支持
    mediaStream = await navigator.mediaDevices.getDisplayMedia(constants);

    // 监听通过关闭共享弹窗时停止计时记录
    mediaStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecord();
    });

    console.log("fe-webrtc mediaStream--", mediaStream);

    if (videoLive) {
        videoLive.srcObject = mediaStream;
    }

    // 用于分段下载
    mediaRecord = new MediaRecorder(mediaStream, mediaOptions);

    /**
     * 分段下载下来拼凑的数据转化成视频和第一段视频一样
     * 可能是分段录取使用了stop和start的方法，导致
     * 各段之间元数据不一样，按照 chunks中的顺序生成第一段视频后
     * 不能和之后的再合成，所以新添加一个 recordWhole 用于整段记录
     * */
    recordWhole = new MediaRecorder(mediaStream, mediaOptions);

    mediaRecord.ondataavailable = e => {
        if (e.data.size > videoSize) {
            // chunks.push(e.data);
            partChunks = [e.data];
        }
    };

    recordWhole.ondataavailable = e => {
        if (e.data.size > videoSize) {
            chunks.push(e.data);
        }
    };

    // console.log("mediaRecord", mediaRecord);
    // console.log("recordWhole", recordWhole);

    //设置timeslice不能兼容分段下载;
    mediaRecord.start();

    recordWhole.start();

    startTime = new Date().valueOf();

    pickDown()

    // 及时更新
    recordTimer = setInterval(() => {
        setTimeHtml();
    }, 1000);

    // 先注释 按照录制分片下载
    // if (recordType !== "one") {
    //     countdown = setInterval(() => {
    //         mediaRecord.stop();
    //         mediaRecord.start(countTime);
    //     }, countTime);
    // }

    console.log("fe-webrtc begin--");
}

/**
 * 停止录制
 */
function stopRecord() {
    clearCurrentInterval();

    if (mediaStream) {
        for (let track of mediaStream.getTracks()) {
            track.stop();
        }
    }

    if (mediaRecord && mediaRecord.state !== "inactive") {
        mediaRecord.stop();
    }

    if (recordWhole && recordWhole.state !== "inactive") {
        recordWhole.stop();
    }

    console.log("fe-webrtc stop--", recordTimes);

    pickUp()

    startTime = 0;

    // 初始化计时器
    setTimeHtml("00:00");
}

/**
 * 下载某段视频
 */
function downloadPart() {
    if (mediaRecord && mediaRecord.state !== "inactive") {
        mediaRecord.stop();
        // 延迟 ondataavailable 中返回数据
        setTimeout(() => {
            createVideo(partChunks);
            mediaRecord.start();
        }, 500);
    } else {
        createVideo(partChunks);
    }
}

/**
 * 下载整片
 */
function download() {
    if (!chunks.length) {
        alert("请在结束共享后下载整片视频");
        return;
    }
    createVideo(chunks);
}

/**
 *  开始共享前充值一些数据
 */
function reset() {
    stopRecord();
    mediaRecord = null;
    recordWhole = null;
    mediaStream = null;
    startTime = 0;
    recordTimes = "00:00";
    chunks = [];
    partChunks = [];
}

/**
 *  清除倒计时
 */
function clearCurrentInterval() {
    if (countdown) {
        clearInterval(countdown);
        countdown = null;
    }

    if (recordTimer) {
        clearInterval(recordTimer);
        recordTimer = null;
    }

    if (btnTimeout) {
        clearTimeout(btnTimeout);
        btnTimeout = null
    }
}

/**
 *  返回下载视频的类型
 */
function getDownloadType() {
    // 设置 a 标签的 download 属性为文件名
    // 有传入的优先
    if (outputType) {
        return outputType;
    }
    // 咩有的从mediaOptions.mimeType获取
    let type = mediaOptions.mimeType.split("/")[1];
    if (type.includes(";")) {
        type = mediaOptions.mimeType.split("/")[1].split(";")[0];
    }
    return type;
}

/**
 * 生成视频
 */
function createVideo(data) {
    if (data == null || data.length == 0) {
        alert("没有视频数据");
        return;
    }

    // 将 Blob 对象转换成一个 URL 地址
    let blob = new Blob(data, {
        type: mediaOptions.mimeType
    });
    let url = URL.createObjectURL(blob);
    console.log("fe-webrtc create--", url);

    // 设置 a 标签的 href 属性为刚刚生成的 URL 地址
    let a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    // 设置 a 标签的 download 属性为文件名
    a.download = `${new Date().getTime()}.${getDownloadType()}`;
    document.body.appendChild(a);
    // 模拟点击 a 标签
    a.click();

    // 可以预览
    if (videoPreview) {
        videoPreview.controls = "controls";
        /**
         *  window.URL.revokeObjectURL 释放过早会导致videoPreview预览失败
         *  所以下面使用了 setTimeout 延时释放
         */
        videoPreview.src = url;
    }

    setTimeout(() => {
        // 释放 URL 地址
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 1000);
}

/**
 * 判断是否大于9
 */
function judgeNine(data) {
    if (data) {
        if (parseInt(data) > 9) {
            return parseInt(data);
        } else {
            return "0" + parseInt(data);
        }
    } else {
        return "00";
    }
}

/**
 *  计算录制时长
 */
function judgeTime() {
    if (!startTime) {
        return "00:00";
    }

    // 获取秒差值
    // var secondTime = (new Date().valueOf() - startTime) / 1000 + 3590;
    var secondTime = parseInt((new Date().valueOf() - startTime) / 1000);
    // 分
    var minuteTime = 0;
    // 小时
    var hourTime = 0;
    if (secondTime >= 60) {
        //如果秒数大于60，将秒数转换成整数
        //获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseInt(secondTime / 60);
        //获取秒数，秒数取佘，得到整数秒数
        secondTime = parseInt(secondTime % 60);
        //如果分钟大于60，将分钟转换成小时
        if (minuteTime >= 60) {
            //获取小时，获取分钟除以60，得到整数小时
            hourTime = parseInt(minuteTime / 60);
            //获取小时后取佘的分，获取分钟除以60取佘的分
            minuteTime = parseInt(minuteTime % 60);
        }
    }

    var time = judgeNine(secondTime);

    if (minuteTime > 0) {
        time = judgeNine(minuteTime) + ":" + time;
    } else {
        time = "00:" + time;
    }

    if (hourTime > 0) {
        time = judgeNine(hourTime) + ":" + time;
    }

    // 要获取视频的时长要比设置的多一秒
    // if (time == "00:05") {
    //     downloadPart();
    // } else if (time == "00:10") {
    //     downloadPart();
    // }

    return time;
}

/**
 * 设置计时器时长
 */
function setTimeHtml(data = "") {
    let timeEle = document.querySelector(".fetab__block_timing");
    let temp = data || judgeTime();
    recordTimes = temp;
    // innerHTML 是推入模版字符串 或是 文本
    timeEle.innerHTML = temp;
}

/**
 *  渲染标签
 */
function render() {
    // 计时块
    const timing = createElement("div", {
        class: "fetab__block_timing",
        text: "00:00"
    });

    // 上模块
    const timeBlock = createElement("div", {
        class: "fetab__block",
        child: [timing],
        style:
            "/* 布局 */width:100%;font-size: 14px;display: flex;align-items: center;justify-content: center;"
    });

    // 下模块
    const contentBtn = createElement("div", {
        class: "fetab__btn",
        style:
            "/* 布局 */height:24px;line-height:24px;display: flex;align-items: center;justify-content: center;transition: .3s all ease;overflow:hidden;"
    });

    // 展示按钮区域
    let btnList = ["开始共享", "下载切片", "下载整片", "结束共享"];
    for (let i = 0; i < btnList.length; i++) {
        let element = createElement("div", {
            class: "fetab__btn_item",
            text: btnList[i],
            style:
                "padding: 0 8px;cursor: pointer;border-radius:6px;transition: .3s all ease-in",

            mouseover: function() {
                // 设置悬浮时的背景色
                this.style.backgroundColor = "#f5f5f6";
            },
            mouseout: function() {
                // 设置悬浮时的背景色
                this.style.backgroundColor = "transparent";
            }
        });

        // 绑定事件
        switch (btnList[i]) {
            case "开始共享":
                element.onclick = startRecord;
                break;
            case "下载切片":
                element.onclick = downloadPart;
                break;
            case "下载整片":
                element.onclick = download;
                break;
            case "结束共享":
                element.onclick = stopRecord;
                break;
        }

        contentBtn.appendChild(element);
    }

    // 主元素
    content = createElement("div", {
        class: "fetab",
        child: [timeBlock, contentBtn],
        style:
            "position: fixed;top: 0px;left: 0;right: 0;z-index: 1200;margin: auto;padding: 4px 8px;width: fit-content;min-width:60px;background: #fff;border: 1px solid #f5f5f5;border-radius: 0px 0px 12px 12px;box-shadow: 0px 6px 8px 0px rgba(199, 199, 199, 0.16);/* 字体 */font-size: 12px;line-height: 1.4;color: #28282a;opacity:0;transition:.3s opacity ease;",

        mouseenter: pickUp,
        mouseleave: pickDown
    });

    // 加入页面中
    if (document) {
        document.body.appendChild(content);
        setTimeout(() => {
            content.style.opacity = 1;
        }, 800);
    }
}

// 创建元素
function createElement(tagName, options = "") {
    let ele = document.createElement(tagName);

    // 文本内容
    if (options.text) {
        ele.innerHTML = options.text;
    }

    // 节点内容
    if (options.child) {
        ele.append(...options.child);
    }

    // 类名
    if (options.class) {
        ele.className = options.class;
    }

    // 具体样式
    if (options.style) {
        // for (let i in options.style) {
        //     ele.style[i] = options.style[i];
        // }
        ele.style.cssText = options.style;
    }

    if (options.src) {
        ele.src = options.src;
    }

    // 鼠标移入
    if (options.mouseover) {
        ele.onmouseover = options.mouseover;
    }

    // 当一个定点设备（通常指鼠标）第一次移动到触发事件元素中的激活区域时，mouseenter 事件在该 Element 中触发。
    if (options.mouseenter) {
        ele.onmouseenter = options.mouseenter;
    }

    // 指点设备（通常是鼠标）的指针移出某个元素时，会触发mouseleave事件。
    if (options.mouseenter) {
        ele.onmouseleave = options.mouseleave;
    }

    // 鼠标移出
    if (options.mouseout) {
        ele.onmouseout = options.mouseout;
    }

    return ele;
}

// 按钮区样式展开
function pickUp() {
    if (startTime) {
        // console.log("记录时鼠标移入组件区域");
        if (btnTimeout) {
            clearTimeout(btnTimeout)
            btnTimeout = null;
        }
        let btnArea = document.querySelector(".fetab__btn");
        btnArea.style.width = 'unset';
        btnArea.style.height = '24px';
        btnArea.style.lineHeight = '24px';
    }
}

// 按钮区样式收起
function pickDown() {
    if (startTime) {
        // console.log("记录时鼠标移出组件区域");
        let btnArea = document.querySelector(".fetab__btn");
        btnTimeout = setTimeout(() => {
            btnArea.style.width = 0;
            btnArea.style.height = 0;
            btnArea.style.lineHeight = 0;
        }, 3000);
    }
}

/**
 *  返回blob数据(promise)
 */
function getBlobData() {
    return new Promise((resolve, reject) => {
        const data = {
            // 分片
            part: "",
            // 整段
            whole: ""
        };

        try {
            if (chunks.length) {
                data.whole = new Blob(chunks, {
                    type: mediaOptions.mimeType
                });
            }

            if (partChunks.length) {
                data.part = new Blob(partChunks, {
                    type: mediaOptions.mimeType
                });
            }
            resolve(data);
        } catch {
            resolve({
                whole: "",
                part: "",
                wholeTimes: recordTimes
            });
        }

        console.log("fewebrtc backData--");
    });
}

module.exports = {
    init,
    getSupports,
    startRecord,
    stopRecord,
    download,
    downloadPart,
    getBlobData
};
