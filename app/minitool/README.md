# 小红书小工具离线构建

此目录复用同一份 React/coss UI 应用，单独生成纯离线小工具产物。不会修改网站构建。十二种方式均只作娱乐，结果恒定“不适合上班”。无联网、存储或外部提交。

## 复现

项目根目录，Node.js 22.12+、npm 10+；压缩使用 Python 3：

```sh
npm ci
node minitool/build.mjs
node minitool/test-runtime.mjs
python3 minitool/package.py
```

脚本输出 `dist-minitool/` 和根目录的 `not-for-work-xiaohongshu-minitool.zip`。Windows 可用 `python` 代替 `python3`。ZIP 根直接包含 `index.html`，不能再套一层目录。

依赖由项目锁文件固定。构建复用已安装的 Vite、Rolldown、PostCSS 与 Lightning CSS，输出 classic IIFE、ES2017 / Chrome61 JS，处理 CSS 选择器、颜色、间距和布局回退，并运行静态检查。`compat.js` 只补充应用实际需要且允许的局部运行时能力。图标与塔罗 SVG、许可证均随包；许可证以 `notices.js` 注释保留。

## 官方审计与验证

当前规范：https://miniapp-sandbox.xiaohongshu.com/minitool/doc
官方构建指南：https://fe-static.xhscdn.com/minitool/20260923133933/minitool-zip-builder-1.7.0.skill

从官方指南取得审计脚本后，分别对 `dist-minitool` 目录与最终 ZIP 运行 `audit_artifact.py`。官方下载指南不纳入本源码包，使用时应重新核对最新规范。

静态校验、Node VM 局部测试以及普通浏览器运行均不能代替小红书容器验收。请上传同一 ZIP，在创服平台模拟器完成全部十二种方式、取消、重试、快速重复点击、出生日期/年月/时辰弹层、居中加载及动效检查；再分别在 Android 和 iOS 真机扫码验证安全区、滚动、软键盘与性能。Chrome61、创服平台模拟器、Android/iOS 真机兼容性与性能尚未实测。
