# 今天适合上班吗？

十二种方式，一个答案。React + TypeScript + Vite + Tailwind CSS v4。

## 本地运行

Node.js 22.12+，npm 10+：

```sh
npm ci
npm run dev
```

## 构建与部署

```sh
npm run build
npm run preview
```

部署 `dist/` 全部内容。相对资源路径支持 `https://damue.fun/not-for-work/`，也支持其他静态目录。不需要后端、CDN、第三方字体、运行时网络请求或平台 API。需要通过 HTTP 静态服务器打开，不直接双击 `index.html`。首次安装 npm 依赖需要网络。

## 真实 coss UI 组件

`src/components/ui/` 的 Button、Select、Calendar、Popover、Field、Spinner 直接来自 https://coss.com/ui 的官方 registry，并在整个应用中复用。昵称表单复用官方 FieldControl + Field/FieldLabel；日期选择器使用官方 Calendar + Popover 组合，年月导航与出生时辰共用 Select。原始 registry 响应保存在 `vendor/coss/`，只调整了 import alias；页面布局和塔罗 SVG 为项目自有实现。

官方安装命令：

```sh
npx shadcn@latest add @coss/button @coss/select @coss/calendar @coss/popover @coss/field @coss/spinner @coss/colors-neutral
```

本次环境的 CLI 代理失败，按官方支持的手动方式从同一 registry 引入源码。使用 Base UI Portal、碰撞定位及焦点管理；日期浮层与其内部年月 Select 分别使用 50/60 层级，避免原生日期弹窗与自定义下拉混用。应用 CSS 不覆盖全局 button/select 样式。

## 隐私与可迁移性

无统计、Cookie、存储、外部接口。出生日期、时辰和选填昵称只存在当前页面内存中，离开表单就销毁，不参与答案计算，也不会发送。昵称不要求实名。所有方式恒定显示“不适合上班”。保留两题 MBTI、星座、生肖、八字、直接点击塔罗翻牌、抽签；新增幸运数字、色彩心理、姓名测试、灵摆、水晶球、六爻。六爻逐次掷币，从下往上显示六条阴阳线；灵摆与水晶球轻触后播放短动画。所有方法均支持取消/重试与减少动态效果，快速重复点击不会重复触发。所有内容仅作娱乐，不提供真实预测或心理、医疗判断。未来可复用交互与资源，无小红书平台接入代码。

## 第三方授权

coss UI registry（apps/ui）按上游 MIT 授权说明使用。授权记录与运行时依赖声明位于 `public/licenses/`；构建时一并复制到输出。
