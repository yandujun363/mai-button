# 埋按钮 (:3っ)∋项目仓库

基于[CaoMeiYouRen/shirakami-haruka-button](https://github.com/CaoMeiYouRen/shirakami-haruka-button)修改[^1]  

**在线体验**：[埋按钮 (:3っ)∋](https://maibutton.yangdujun.top)  
**GitHub Pages**：[https://yandujun363.github.io/mai-button/](https://yandujun363.github.io/mai-button/)  
**模板仓库**:[yandujun363/audio-button-template](https://github.com/yandujun363/audio-button-template)

感谢[春虎Harutora](https://space.bilibili.com/7813737)提供的主播音频文件  
代码部分使用MIT协议开源

---

## 项目简介

一个纯粹的音频播放按钮网站，收录了[坷埋埋](https://space.bilibili.com/3546775765912341)的经典音频片段。采用原生JavaScript开发，支持音频缓存、循环播放、随机播放等功能，旨在为用户提供流畅、有趣的音频播放体验。

---

## 核心特性

- **音频缓存系统**：使用IndexedDB缓存音频文件，提升二次加载速度
- **预加载机制**：启动时预加载所有音频，减少播放延迟
- **叠加播放**：支持同时播放多个音频，创造鬼畜效果
- **循环模式**：开启"洗脑循环"模式，让音频无限循环播放
- **完全离线支持**：通过 Service Worker 缓存所有静态资源，支持离线访问
- **响应式设计**：适配各种屏幕尺寸
- **多语言支持**：预留多语言接口，便于国际化扩展

---

## 项目结构

```
mai-button/
├── index.html                    # 主页面（含 Import Map 配置）
├── styles.css                    # 样式文件
├── sw.js                         # Service Worker（PWA离线支持）
├── favicon.jpg                   # 网站图标
├── CNAME                         # 自定义域名配置
├── README.md                     # 说明文档
├── LICENSE                       # MIT许可证
├── public/                       # 公共资源
│   └── voices/                   # 音频文件目录
│       ├── he~~~tui.mp3
│       ├── 伸懒腰.mp3
│       └── ...（所有音频文件）
└── src/                          # 源码目录（ES Module）
    ├── app/                      # 应用层
    │   ├── audioInitializer.js   # 音频初始化
    │   ├── cdnManager.js         # CDN管理
    │   ├── eventBinder.js        # 事件绑定
    │   └── index.js              # 应用入口
    ├── config/                   # 配置
    │   ├── cdns.js               # CDN源配置
    │   └── voices.js             # 音频配置文件
    ├── core/                     # 核心逻辑
    │   ├── audioLoader.js        # 音频加载器
    │   ├── audioPlayer.js        # 音频播放器
    │   └── state.js              # 应用状态管理
    ├── locales/                  # 国际化
    │   └── zh.js                 # 中文语言包
    ├── storage/                  # 存储层
    │   ├── audioCache.js         # 音频缓存（IndexedDB）
    │   ├── cdnSettings.js        # CDN设置存储
    │   └── db.js                 # 数据库连接
    └── ui/                       # UI渲染
        ├── cdnRenderer.js        # CDN选择器渲染
        └── voiceRenderer.js      # 语音按钮渲染
```

---

## 使用指南

- **点击按钮**即可播放对应音声
- **多次点击**可以造成相当鬼畜的效果
- **开启洗脑循环**将会一直播放一个音频
- **同时开启循环播放和洗脑循环**将会出现 **地 狱 绘 卷**
- **首次访问**：页面会自动注册 Service Worker，缓存所有资源，后续访问可完全离线使用

---

## 技术栈

- **纯原生JavaScript**（无框架依赖）
- **ES6模块系统** + **Import Map**（浏览器原生模块加载）
- **IndexedDB** 用于音频缓存
- **Service Worker**（PWA）实现完全离线访问
- **CSS3自定义属性**（CSS变量）
- **响应式设计**

---

## 架构说明

### Service Worker（sw.js）
- 在首次访问时自动注册
- 缓存所有静态资源（HTML、CSS、JS、音频文件）
- 支持 `Cache-First` 策略，确保离线可用

### Import Map（index.html）
- 使用浏览器原生 Import Map 管理模块依赖
- 无需打包工具，直接在浏览器中使用 ES Module
- 便于模块路径映射和版本管理

---

## 添加新音频

1. 将音频文件放入`public/voices/`目录
2. 在`src/config/voices.js`中添加配置：
```javascript
{
    messages: { zh: "音频描述" },
    path: "文件名.mp3",
    tag: "分类标签"
}
```
3. 如果需要新的分类标签，在`src/locales/zh.js`中添加翻译

---

## 贡献指南

欢迎提交Issue和Pull Request！包括但不限于：
- 修复bug
- 添加新功能
- 优化性能
- 改进UI/UX
- 翻译本地化

---

## 许可证

本项目采用 **MIT许可证** - 查看 [LICENSE](LICENSE) 文件了解详情

音频文件版权归原主播所有，仅用于学习和交流目的

---

## 致谢

- [CaoMeiYouRen/shirakami-haruka-button](https://github.com/CaoMeiYouRen/shirakami-haruka-button) - 原项目灵感来源
- [春虎Harutora](https://space.bilibili.com/7813737) - 提供主播音频文件
- 所有贡献者和用户

---

## 常见问题

### Q: 为什么音频加载需要时间？
A: 首次访问时会预加载所有音频文件，之后会缓存在浏览器中，后续访问会非常快速。

### Q: 如何清除缓存？
A: 
- **音频缓存**：浏览器开发者工具 → Application → IndexedDB → 删除相关数据
- **Service Worker 缓存**：浏览器开发者工具 → Application → Cache Storage → 删除对应缓存

### Q: 支持移动端吗？
A: 是的，完全响应式设计，支持移动端访问。并且支持添加到主屏幕（PWA）。

### Q: 音频可以下载吗？
A: 音频版权归原主播所有，请勿用于商业用途。

### Q: 为什么首次访问后离线也能使用？
A: 项目使用 Service Worker 在首次访问时缓存了所有静态资源，包括音频文件，因此离线状态下依然可以正常使用。

---

[^1]:原项目不知道为啥Build之后白屏，但是Dev没问题，可能是太老古董了吧，然后就塞AI让AI写了个效果差不多的，虽然还是有点小问题。

---

**快乐玩耍，文明使用！**

如有问题，欢迎在GitHub Issues中提出！