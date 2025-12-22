# 埋按钮 (:3っ)∋项目仓库

基于[CaoMeiYouRen/shirakami-haruka-button](https://github.com/CaoMeiYouRen/shirakami-haruka-button)修改[^1]  

**在线体验**：[埋按钮 (:3っ)∋](https://maibutton.yangdujun.top)  
**GitHub Pages**：[https://yandujun363.github.io/mai-button/](https://yandujun363.github.io/mai-button/)

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
- **响应式设计**：适配各种屏幕尺寸
- **多语言支持**：预留多语言接口，便于国际化扩展

---

## 项目结构

```
mai-button/
├── index.html                    # 主页面
├── styles.css                    # 样式文件
├── app.js                        # 主应用程序（ES模块）
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

## 使用指南

- **点击按钮**即可播放对应音声
- **多次点击**可以造成相当鬼畜的效果
- **开启洗脑循环**将会一直播放一个音频
- **同时开启循环播放和洗脑循环**将会出现 **地 狱 绘 卷**

---

## 技术栈

- **纯原生JavaScript**（无框架依赖）
- **ES6模块系统**
- **IndexedDB** 用于音频缓存
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



[^1]:原项目不知道为啥Build之后白屏，但是Dev没问题，可能是太老古董了吧，然后就塞AI让AI写了个效果差不多的，虽然还是有点小问题。



**快乐玩耍，文明使用！**

如有问题，欢迎在GitHub Issues中提出！


---
# 重要部署警告

## 关于统计代码的必读事项

如果你要Fork并部署此项目，**必须修改以下配置**：

### 必须修改的配置（否则数据会跑错地方！）

```javascript
const analytics = new AnalyticsConsent({
  // 必须修改：这是你的Umami网站ID，从你的Umami后台获取
  websiteId: "PUT_YOUR_WEBSITE_ID_HERE",
  
  // 必须修改：这是你的Umami脚本地址
  umamiUrl: "你的Umami脚本地址",
  
  // 必须修改：你的隐私政策页面
  privacyPolicyUrl: "你的隐私政策页面",
  
  // 必须修改：你的欧盟检测API（如果不需要可以禁用）
  euDetectionApi: "你的欧盟检测API",
  
  // ... 其他配置可以保持默认
});
```

### 快速修改方法

在 `index.html` 文件中，找到这段代码：

```javascript
const analytics = new AnalyticsConsent({
  umamiUrl: "https://js.yangdujun.top/version.js",      // 改为你的地址
  websiteId: "02d69265-97af-44ea-9e73-9607ee9076bc",    // 改为你的ID
  // ... 其他配置
});
```

### 如果你不需要统计

可以直接删除整个统计代码块：

```html
<!-- 删除从 <script type="module"> 到 </script> 的所有内容 -->
```

### 欧盟GDPR合规说明

如果你不面向欧盟用户，可以禁用欧盟检测，禁用后默认当作欧盟用户处理：

```javascript
const analytics = new AnalyticsConsent({
  // ... 其他配置
  enableEuDetection: false,  // 禁用欧盟检测
});
```

### 复用 ac.js 的注意事项

虽然你可以复用 `ac.js` 组件，但**必须传入正确的参数初始化**：

```javascript
// 错误：直接复用会导致数据发送到原作者服务器
import AnalyticsConsent from "https://cdn.yangdujun.top/js/ac.js";

// 正确：传入你自己的配置
const analytics = new AnalyticsConsent({
  umamiUrl: "你的Umami统计脚本地址",
  websiteId: "你的网站ID",
  privacyPolicyUrl: "你的隐私政策链接",
  // ... 其他参数
});
```

### 检查清单

部署前请确认：
- [ ] 修改了 `websiteId`（从你的Umami后台获取）
- [ ] 修改了 `umamiUrl`（指向你的Umami实例）
- [ ] 修改了 `privacyPolicyUrl`（你的隐私政策页面）
- [ ] 修改了 `euDetectionApi` 或禁用了欧盟检测
- [ ] 测试了统计功能（确认数据出现在你的后台）

### 后果警告

如果不修改配置：
1. **你的网站数据会发送到原作者的Umami后台**
2. **原作者能看到你的网站访问统计**
3. **你无法在自己的后台看到任何数据**
4. **可能违反隐私法规（GDPR等）**

### 如何获取配置

1. **部署自己的Umami**：[Umami官方文档](https://umami.is/docs)
2. **获取websiteId**：在Umami后台创建网站后获得
3. **配置隐私政策**：创建符合法规的隐私政策页面

---

**记住：修改统计配置是部署的第一步，不是可选项！**

如果忘记修改，你的用户数据会被别人收集，而你对此一无所知。

---

## 相关链接

- [Umami官方文档](https://umami.is/docs)
- [GDPR合规指南](https://gdpr.eu/)