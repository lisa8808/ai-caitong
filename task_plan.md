# 任务计划：自选模块接入 Tushare

## 当前任务：财瞳金融整站现状 PRD（2026-07-10）

### 目标
基于当前代码事实生成“财瞳金融整站现状梳理版”B 端标准 PRD，面向技术人员，重点描述 Tushare 集成，并严格区分真实数据、前端 Demo 与纯展示占位能力。

### 阶段
- [x] 明确产品范围、角色、版本和约束
- [x] 盘点桌面端、移动端、数据服务、接口和本地存储
- [x] 按标准目录生成 `PRD-caitong-finance-current-state.md`
- [x] 校验目录、事实一致性和构建状态

### 当前状态
已完成

### 关键决策
| 项目 | 决策 |
|---|---|
| 产品范围 | 财瞳金融整站 |
| 文档类型 | 现状梳理版，不把规划能力写成已实现 |
| 核心角色 | 技术人员，包括研发、测试、运维和技术产品 |
| 核心约束 | 纳入 Tushare 代理、权限差异、缓存、回退和部署边界 |
| 事实来源 | 当前仓库代码、配置、静态数据和已验证接口 |

## 目标
将“自选”菜单下所有可由行情服务提供的数据，从当前静态 mock 改为通过 Tushare 获取；同时保留用户私有数据（自选日、自选价格、持仓数量、成本价）的本地/后端存储与计算能力，避免在前端暴露 Tushare token。

## 当前阶段
阶段 6：验证与降级

## 已确认决策（2026-07-02）
| 问题 | 决策 | 影响 |
|---|---|---|
| Tushare token 与权限 | 已有 | 可以按真实接口设计，不需要停留在 mock 方案 |
| 前端部署 | 继续 GitHub Pages | 必须额外部署 API 代理服务，GitHub Pages 只托管静态前端 |
| 用户数据保存 | 先保留当前浏览器 | 第一版使用 `localStorage` 保存自选股、持仓数量、成本价、自选价格 |

## 范围边界
| 内容 | 是否从 Tushare 获取 | 说明 |
|---|---:|---|
| 股票基础信息、名称、市场 | 是 | `stock_basic` |
| 行情价格、涨跌幅、最高最低 | 是 | 实时行情优先，日线行情兜底 |
| 换手率等基础日指标 | 是 | `daily_basic` |
| 分时/K线/多股同列走势 | 是 | 分钟线或日线接口，视权限兜底 |
| 资金流向 | 是 | 资金流接口，视权限和字段映射 |
| 自选日、自选价格 | 否 | 用户添加自选时记录 |
| 持仓数量、成本价 | 否 | 用户账户/本地数据，不属于 Tushare 行情 |
| 市值、盈亏、盈亏率、自选收益 | 部分 | Tushare 当前价 + 用户数据计算 |

## 各阶段

### 阶段 1：需求与数据边界
- [x] 梳理自选模块现有 mock 数据来源
- [x] 区分 Tushare 行情数据与用户私有数据
- [x] 记录发现到 `findings.md`
- **状态：** complete

### 阶段 2：接口与部署方案确认
- [x] 确认 Tushare token 权限：用户已有 token 与相关权限
- [x] 确认部署方式：前端继续 GitHub Pages，API 代理需单独部署
- [x] 确认用户数据保存方式：第一版使用浏览器 `localStorage`
- [x] 确认刷新策略：进入页面刷新 + 手动刷新
- **状态：** complete

### 阶段 3：服务端代理设计
- [x] 新增服务端环境变量 `TUSHARE_TOKEN`
- [x] 新增前端环境变量 `VITE_API_BASE_URL` 指向独立 API 服务
- [x] 设计统一 Tushare 调用函数：请求、超时、错误处理、字段转换
- [x] 设计 API：`GET /api/watchlist/quotes?codes=` 获取自选行情
- [x] 设计 API：`GET /api/stocks/search?q=` 获取添加自选搜索结果
- [x] 设计 API：`GET /api/stocks/:code/detail` 获取右侧详情
- [x] 设计 API：`GET /api/stocks/:code/chart?period=` 获取分时/K线数据
- [x] 设计 API：`GET /api/stocks/:code/moneyflow` 获取资金流向
- [x] 增加短缓存，避免高频消耗 Tushare 配额
- **状态：** complete

### 阶段 4：前端数据层改造
- [x] 新增 `src/services/watchlistService.ts`
- [x] 新增 Tushare/后端返回类型与前端类型映射
- [x] 将 `WatchlistPage` 从静态导入改为异步加载
- [x] 加入 loading、empty、retry 状态
- [x] 将添加自选搜索从组件内数组改为 API 搜索
- [x] 将持仓页行情字段改为 Tushare 行情合并，持仓数量/成本价保留用户侧
- [x] 将右侧详情、分时图、资金流从 mock 改为按选中股票请求
- [x] 将右侧关联板块、成份股从未开发状态改为按选中股票请求
- [x] 将 `MultiStockView` 改为接收自选数据 props
- **状态：** complete

### 阶段 5：用户数据保存
- [x] 设计本地自选列表结构：`证券代码`、`证券名称`、`自选日`、`自选价格`
- [x] 设计持仓结构：`证券代码`、`证券名称`、`持仓数量`、`成本价`
- [x] 第一版可用 `localStorage` 保存，后续可迁移到后端
- [x] 自选收益、市值、盈亏等字段由行情 + 用户数据实时计算
- **状态：** complete

### 阶段 6：验证与降级
- [x] 无 API 地址或接口失败时使用 mock fallback
- [x] Tushare 超时/额度不足时页面不崩溃
- [x] `npm run build` 通过
- [x] 使用真实 token 联调详情、图表、资金流接口
- [ ] 页面人工核验自选、持仓、多股同列、添加自选完整交互
- **状态：** in_progress

## 本地运行方式
1. 启动代理：`TUSHARE_TOKEN=你的token npm run dev:api`
2. 启动前端：`VITE_API_BASE_URL=http://localhost:8787 npm run dev -- --host 0.0.0.0`
3. 生产部署：GitHub Pages 部署前端，代理服务单独部署，并在前端构建时设置 `VITE_API_BASE_URL` 为代理公网地址。

## 推荐接口映射
| 前端页面 | 后端接口 | Tushare 数据源 | 核心字段 |
|---|---|---|---|
| 自选列表 | `/api/watchlist/quotes?codes=600519.SH,300750.SZ` | 实时行情 / `daily` + `daily_basic` | 现价、涨幅、涨跌、最高、最低、换手 |
| 添加自选搜索 | `/api/stocks/search?q=茅台` | `stock_basic` | ts_code、name、market、list_status |
| 右侧详情 | `/api/stocks/688318.SH/detail` | `stock_basic` + 行情 | 名称、代码、市场标签、现价、涨跌幅 |
| 分时/K线 | `/api/stocks/688318.SH/chart?period=1min` | 分钟线/日线 | time、price、vol |
| 资金流向 | `/api/stocks/688318.SH/moneyflow` | `moneyflow` | 主力/散户流入流出或可映射字段 |

## 实施建议
第一版先做“自选列表 + 添加搜索 + 持仓行情合并”，这是用户最能感知的数据真实性；第二版再做右侧详情、分时图、资金流；第三版再优化缓存、权限兜底和部署。

## 推荐部署形态
| 部分 | 部署位置 | 说明 |
|---|---|---|
| 前端静态页面 | GitHub Pages | 继续使用 `/caitong-finance/` base path |
| Tushare API 代理 | 单独服务，例如 Vercel/Render/云服务器 | 保存 `TUSHARE_TOKEN`，对外只暴露业务 API |
| 用户自选/持仓 | 浏览器 `localStorage` | 当前浏览器可用，后续账号同步时迁移到后端数据库 |

## 第一版落地顺序
1. 新增 `src/services/watchlistStorage.ts`：负责本地自选、持仓读写。
2. 新增 `src/services/watchlistService.ts`：负责调用 `VITE_API_BASE_URL`，失败时 fallback 到 mock。
3. 新增 API 代理工程或 `server/` 目录：封装 Tushare 请求。
4. 改造 `WatchlistPage`：自选列表、添加搜索、持仓行情合并改为异步数据。
5. 改造 `MultiStockView`：接收自选列表数据，不再直接导入静态 `watchlistStocks`。
6. 运行 `npm run build` 验证前端。

## 待确认问题
1. 刷新策略采用哪种：进入页面刷新 + 手动刷新，还是增加定时刷新？
2. API 代理优先部署在哪里：Vercel、Render、云服务器，还是你已有服务？

---

# 历史任务计划：财瞳金融PC终端 - 市场模块

## 目标
复刻通达信金融终端深色模式界面，创建财瞳市场模块，含四区域布局、股票列表、个股详情、底部状态栏

## 当前阶段
阶段 1：需求与结构

## 各阶段

### 阶段 1：需求与发现
- [x] 理解用户意图：复刻通达信深色金融终端
- [x] 确定约束条件：PC端、四区域固定布局、深色主题
- [x] 将发现记录到 findings.md
- **状态：** complete

### 阶段 2：规划与结构
- [ ] 确定技术方案：React + TypeScript + Tailwind CSS
- [ ] 创建项目结构
- [ ] 创建 task_plan.md、findings.md、progress.md
- **状态：** in_progress

### 阶段 3：实现
- [ ] 创建项目基础结构（Vite + React + TS）
- [ ] 实现全局布局框架
- [ ] 实现顶部标题栏和导航栏
- [ ] 实现左侧垂直导航栏
- [ ] 实现中间股票列表表格
- [ ] 实现右侧个股详情面板
- [ ] 实现底部大盘状态栏
- [ ] 实现图表组件（分时图、日线图）
- **状态：** pending

### 阶段 4：测试与验证
- [ ] 验证所有需求已满足
- [ ] 将测试结果记录到 progress.md
- **状态：** pending

### 阶段 5：交付
- [ ] 检查所有输出文件
- [ ] 确保交付物完整
- **状态：** pending

## 技术决策
| 决策 | 理由 |
|------|------|
| Vite + React + TypeScript | 现代前端工具链，开发效率高 |
| Tailwind CSS | 快速实现深色金融风格 |
| Recharts | 轻量级图表库，支持分时/日线图 |
| 无需Router | 单页面市场模块足够了 |

## 色彩规范
| 元素 | 色值 |
|------|------|
| 主背景 | #121723 |
| 导航/表头背景 | #1E2230 |
| 上涨文字 | #FF4D4F |
| 下跌文字 | #52C41A |
| 中性文字 | #FFFFFF |
| 次要文字 | #8C8F98 |
| 图表背景 | #161A28 |
| 分时价格线 | #FFAA00 |

## 备注
- 目录为空，从零开始搭建
