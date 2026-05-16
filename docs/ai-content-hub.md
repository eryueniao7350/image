# AI 内容中台

飞书 Base：`AI 内容中台`

Base 链接：
`https://fcnle2mef8s6.feishu.cn/base/GZK8bDUSTa30zDsHHmUcO0KqnFd`

## 已完成接入

- `AIHOT`：已通过 live API 验证，可返回当日精选内容
- `Feishu Base`：已创建 10 张业务表
- `Codex Automations`：已创建 2 条定时任务
- `GitHub Actions`：可承接稳定版 `AIHOT 精选同步`

## 10 张业务表

1. `01 每日素材池`
2. `02 AIHOT 精选入库`
3. `03 历史对标文章库`
4. `04 X 推文情报库`
5. `05 知识卡片库`
6. `06 选题池`
7. `07 草稿与成稿库`
8. `08 封面与视觉资产库`
9. `09 Agent 任务台`
10. `10 工作流说明`

说明：
- `03 历史对标文章库` 仅用于已有历史数据或后续人工补充
- 不再把 “从 AIHOT 抓公众号爆文” 作为来源说明
- 所有发布动作保留人工确认，不启用自动发布

## 已登记工作流

- `更新今日内容中台`
- `生成今日选题卡`
- `把这个选题写成公众号初稿`
- `给这篇文章生成多平台封面方案`
- `复盘这篇文章`

## 已创建自动化

- `AIHOT 精选同步`
  - 周期：每 4 小时
  - 动作：同步 AIHOT 精选到 `02 AIHOT 精选入库` 和 `01 每日素材池`
  - 推荐执行器：GitHub Actions `aihot-sync.yml`
- `今日选题卡生成`
  - 周期：每天 `09:00`
  - 动作：根据过去 24 小时素材生成 `06 选题池` 推荐

## 运行约束

- 自动化只做素材同步、选题推荐、任务状态回写
- 不执行自动发布
- 不写入任何 App Secret、授权码、token 到业务表

## 运维提示

- 任务日志路径约定：
  - `ops/logs/aihot_sync.log`
  - `ops/logs/topic_recommendation.log`
- AIHOT 同步脚本：
  - `python3 ops/aihot_sync.py --hours 4`
- GitHub Actions secrets：
  - `FEISHU_APP_ID`
  - `FEISHU_APP_SECRET`
  - `FEISHU_BASE_TOKEN`
- 可选 GitHub Actions vars：
  - `FEISHU_AIHOT_TABLE_ID`
  - `FEISHU_DAILY_POOL_TABLE_ID`
  - `FEISHU_TASKS_TABLE_ID`
  - `FEISHU_AIHOT_TASK_RECORD_ID`
  - `FEISHU_AIHOT_TASK_NAME`
  - `FEISHU_TASK_NAME_FIELDS`
- 新方案不再依赖 `lark-cli` keychain；飞书 Base 写入改为直接走 OpenAPI
- 本地 Codex cron 在 GitHub Actions 接管后建议暂停，避免重复同步
- 如果需要手动复核，可先查看飞书 `09 Agent 任务台`
- 如果需要手动触发一次流程，可在 Codex 中基于对应工作流说明执行
