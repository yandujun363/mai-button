# 埋按钮 (:3っ)∋项目仓库

基于[CaoMeiYouRen/shirakami-haruka-button](https://github.com/CaoMeiYouRen/shirakami-haruka-button)修改[^1]  

**在线体验**：[埋按钮 (:3っ)∋](https://maibutton.yangdujun.top)  
**GitHub Pages**：[https://your-username.github.io/mai-button/](https://your-username.github.io/mai-button/)

感谢[春虎Harutora](https://space.bilibili.com/7813737)提供的主播音频文件  
代码部分使用MIT协议开源

---

## 🎯 项目简介

一个纯粹的音频播放按钮网站，收录了多位VTuber/主播的经典音频片段。采用原生JavaScript开发，支持音频缓存、循环播放、随机播放等功能，旨在为用户提供流畅、有趣的音频播放体验。

---

## ✨ 核心特性

- **🎵 音频缓存系统**：使用IndexedDB缓存音频文件，提升二次加载速度
- **🚀 预加载机制**：启动时预加载所有音频，减少播放延迟
- **🔄 叠加播放**：支持同时播放多个音频，创造鬼畜效果
- **🔁 循环模式**：开启"洗脑循环"模式，让音频无限循环播放
- **📱 响应式设计**：适配各种屏幕尺寸
- **💾 离线支持**：支持Service Worker，可在无网络环境下使用
- **🌐 多语言支持**：预留多语言接口，便于国际化扩展

---

## 📁 项目结构

```
mai-button/
├── index.html                    # 主页面
├── styles.css                    # 样式文件
├── app.js                        # 主应用程序（ES模块）
├── service-worker.js             # 服务工作者（PWA支持）
├── README.md                     # 说明文档
├── public/                       # 公共资源
│   └── voices/                   # 音频文件目录
│       ├── he~~~tui.mp3
│       ├── 伸懒腰.mp3
│       └── ...（所有音频文件）
└── src/                          # 源码目录
    ├── config/
    │   └── voices.js             # 音频配置文件
    └── locales/
        └── zh.js                 # 中文语言包
```

---

## 🚀 快速部署

### GitHub Pages部署

1. **Fork本仓库**到你的GitHub账户
2. **启用GitHub Pages**：
   - 进入仓库设置 → Pages
   - 选择分支（通常是`main`或`master`）
   - 选择根目录`/root`
   - 点击保存

3. **访问你的页面**：
   ```
   https://你的用户名.github.io/mai-button/
   ```

### 自定义域名部署

1. **在仓库设置中添加自定义域名**：
   - 进入仓库设置 → Pages → Custom domain
   - 输入你的域名（如：maibutton.yangdujun.top）

2. **在域名服务商处配置CNAME记录**：
   ```
   @   A       185.199.108.153
   @   A       185.199.109.153
   @   A       185.199.110.153
   @   A       185.199.111.153
   
   www CNAME   你的用户名.github.io
   ```

3. **等待DNS生效**（通常需要几分钟到几小时）

---

## 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/你的用户名/mai-button.git
cd mai-button

# 本地运行（需要本地服务器）
# 可以使用Python或Node.js启动本地服务器

# Python 3
python -m http.server 8000

# Node.js (如果有http-server)
npx http-server

# 访问 http://localhost:8000
```

---

## 📱 使用指南

- **点击按钮**即可播放对应音声
- **多次点击**可以造成相当鬼畜的效果
- **开启洗脑循环**将会一直播放一个音频
- **同时开启循环播放和洗脑循环**将会出现 **地 狱 绘 卷**

---

## 技术栈

- **纯原生JavaScript**（无框架依赖）
- **ES6模块系统**
- **IndexedDB** 用于音频缓存
- **Service Worker** 实现PWA特性
- **CSS3自定义属性**（CSS变量）
- **响应式设计**

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
A: 浏览器开发者工具 → Application → IndexedDB → 删除相关数据

### Q: 支持移动端吗？
A: 是的，完全响应式设计，支持移动端访问。

### Q: 音频可以下载吗？
A: 音频版权归原主播所有，请勿用于商业用途。

---

[^1]:原项目不知道为啥Build之后白屏，但是Dev没问题，可能是太老古董了吧，然后就塞AI让AI写了个效果差不多的，虽然还是有点小问题。

---

**快乐玩耍，文明使用！** 🎉

如有问题，欢迎在GitHub Issues中提出！