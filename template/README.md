---
description: "用于新的适配Agent的文档体系模板。"
kind: "package-reference"
---
# 适配Agent的文档体系模板

## 概述

让每个页面都可被搜索、可被新人读懂，并且对 agent 和维护者足够精确；同时让文档网站始终是仓库 Markdown 经过测试的投影。

## 目录

- 使用本包
- 理解实现
- 进一步探索
- 模型体验
- 已知限制与延期工作
- 开发备注

## 使用本模块

当组合需要由按会话文件支撑的持久会话时挂载此后端。常用路径是显式的：加载会话服务、挂载后端，然后给出根目录。

## 理解实现

### 设计理念

### 物理编码


### 源码地图


| 文件                                             | 职责                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `agent-dev-template/`                          | Agent 研发模板项目根目录                                           |
| `agent-dev-template/AGENTS.md`                 | 项目级研发规则与导航入口                                           |
| `agent-dev-template/README.md`                 | 项目介绍与使用说明                                                 |
| `agent-dev-template/docs/`                     | 系统认知、工程规范与知识文档                                       |
| `agent-dev-template/docs/AGENTS.md`            | 文档维护规则                                                       |
| `agent-dev-template/docs/architecture.md`      | 架构文档；记录架构，并将 Package README 改名为 Module README       |
| `agent-dev-template/docs/subsystems/`          | 子系统相关文档目录，需进一步考虑其组织方式                         |
| `agent-dev-template/docs/postmortem/`          | 故障复盘记录；聚焦隐蔽性、系统性、重复发现成本高的问题             |
| `agent-dev-template/docs/defensive-patterns/`  | 防御性模式；用于识别和防止错误，无需通读故障复盘                   |
| `agent-dev-template/docs/core-guidelines/`     | 核心开发准则；规定后续代码设计与编辑原则                           |
| `agent-dev-template/docs/cookbook/`            | 工程操作指南；沉淀已验证操作方法，避免新 Agent 重复调查相同任务    |
| `agent-dev-template/docs/persistence-changes/` | 持久化变化记录                                                     |
| `agent-dev-template/.agents/`                  | Agent 研发流程、设计提案与决策记录                                 |
| `agent-dev-template/.agents/notes/`            | 将研发输入转化为标准化工程变更，并对工程变更进行生命周期管理的机制 |
| `agent-dev-template/.agents/skills/`           | 积累下来的知识，并使其真正参与研发                                 |
| `agent-dev-template/scripts/`                  | 工程检查与自动化脚本                                               |
| `agent-dev-template/研发输入/`                 | 原始需求、外部约束与研发参考资料                                   |
| `agent-dev-template/template/`                 | 模板交付产物                                                       |

### 进一步探索

## 模型体验

## 已知限制与延期工作

### 开发备注
