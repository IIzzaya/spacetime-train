# spacetime-train · 时空列车流程验证版

`spacetime-train` 是一款以界面为主的静态 Web 前端游戏项目。玩法结合网格库存、基地生产、增量成长和随机外出搜刮。

本仓库保留游戏设计文档，并加入一个零依赖的静态浏览器流程验证原型：准备 → 自动探索 → 网格战利品回仓 → 基地生产。它不是完整首版；界面中的“时空列车”为工作名称，正式名称尚未确定。

**在线试玩**：https://iizzaya.github.io/spacetime-train/

## 运行原型

需要 Node.js 22+（测试与构建），浏览器需支持 ES modules、原生 dialog 和 localStorage。无需 npm install。

```sh
npm run check
npm test
npm run build
python3 -m http.server 4173 --directory dist
```

打开 http://localhost:4173/。使用静态服务器访问，不要直接双击 HTML。所有资源使用相对路径，可部署到 GitHub Pages 的 `/spacetime-train/` 子路径。

操作、暂定参数、未实现内容与验证记录见[原型说明](docs/prototype.md)。GitHub Actions 工作流先检查与测试，再构建和部署 `dist/`；仓库须另行启用 Pages 的 GitHub Actions 来源。首轮自动部署与线上核心流程已验证通过；详细边界见原型说明。

## 从这里开始

- [文档索引](docs/README.md)：按模块查阅规则。
- [设计总览](docs/overview.md)：了解核心循环、设计边界和当前状态。
- [设计决定](docs/decisions.md)：查阅已确认决定及其替代的旧方案。
- [待确认问题](docs/open-questions.md)：查看实现前仍需确定的规则。

## 玩法模块

| 模块 | 主要内容 |
| --- | --- |
| [外出与生存](docs/modules/expedition-survival.md) | 配装、自动探索、全损、补给与基地恢复 |
| [网格库存](docs/modules/grid-inventory.md) | 拾取、主动换装、换包迁移与回仓整理 |
| [基地生产](docs/modules/production.md) | 土豆、水、共享热量与机器输入输出 |
| [时间与世界](docs/modules/time-world.md) | 普通游戏时钟、外出快进、真时与地图 |
| [成长与后续方向](docs/modules/progression-future.md) | 高级拾取、保险、电炉、列车与时空乱流 |

## 如何理解文档状态

- **已确认**：设计方向或规则已确认，不代表已经实现。
- **暂定示例**：用于解释关系的数值或例子，不是最终平衡参数。
- **后续方向**：保留的成长或扩展设想，未自动进入首版范围。
- **待确认**：信息不足，使用 `【待确认：具体问题】` 标记。

完整首版范围和里程碑尚未确定。本次验证原型使用原生 HTML/CSS/JavaScript；这不锁定完整产品技术栈。不要把全部已确认方向或后续设想视为首版制作清单。

文档版本：v0.1 设计快照。更新日期：2026-10-03。术语及维护方式见[文档约定](docs/documentation.md)与[项目词汇表](docs/glossary.md)。
