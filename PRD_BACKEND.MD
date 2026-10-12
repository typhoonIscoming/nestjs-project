# Backend PRD：Web3 Career 招聘平台

## 1. 目标与范围
本文档聚焦后端系统设计、接口设计、数据模型、权限体系和技术架构。目标是：

- 支撑岗位、用户、公司、投递、审核等核心业务
- 提供安全、稳定、可扩展的 API 能力
- 支持招聘方和求职者的关键流程闭环

## 2. 业务对象与核心模块

### 2.1 User（用户）
用户包括：
- 求职者
- 招聘方
- 管理员

核心字段：
- id
- email
- password_hash
- role
- name
- avatar
- status
- created_at
- updated_at

### 2.2 Company（公司）
- id
- name
- description
- logo_url
- website
- industry
- status
- created_at

### 2.3 Job（岗位）
- id
- company_id
- title
- category
- location
- salary_min
- salary_max
- job_type
- remote
- description
- requirements
- status
- published_at
- created_at

### 2.4 Application（投递）
- id
- job_id
- user_id
- resume_url
- status
- applied_at
- updated_at

### 2.5 Favorite（收藏）
- id
- user_id
- job_id
- created_at

## 3. 核心功能需求

### 3.1 用户认证授权
功能：
- 注册
- 登录
- 退出
- 刷新 token
- 重置密码
- 邮箱校验

建议：
- 使用 JWT
- 基于 RBAC 实现角色权限控制
- 对密码做加盐哈希处理

### 3.2 岗位管理
功能：
- 创建岗位
- 编辑岗位
- 下线/删除岗位
- 获取岗位列表
- 获取岗位详情
- 审核岗位状态

状态：
- draft
- pending_review
- published
- rejected
- closed

### 3.3 公司管理
功能：
- 公司注册
- 公司资料更新
- 公司认证
- 关联岗位

### 3.4 投递管理
功能：
- 候选人投递岗位
- 查看投递记录
- 更新投递状态
- 候选人/企业消息通知

状态：
- applied
- viewed
- interviewing
- rejected
- accepted

### 3.5 搜索与筛选
支持字段：
- 关键词
- 地区
- 类型
- 薪资范围
- 岗位领域
- 远程状态

未来扩展：
- Elasticsearch / 全文检索
- 相关岗位推荐

### 3.6 管理后台能力
功能：
- 审核岗位
- 处理举报
- 用户封禁与解禁
- 平台数据统计
- 审核日志

## 4. API 设计

### 4.1 认证 API
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/reset-password

### 4.2 岗位 API
- GET /api/jobs
- GET /api/jobs/:id
- POST /api/jobs
- PUT /api/jobs/:id
- DELETE /api/jobs/:id
- POST /api/jobs/:id/apply

### 4.3 公司 API
- GET /api/companies
- GET /api/companies/:id
- POST /api/companies
- PUT /api/companies/:id

### 4.4 用户 API
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/applications
- GET /api/users/favorites

### 4.5 管理 API
- GET /api/admin/jobs/review
- POST /api/admin/jobs/:id/review
- GET /api/admin/reports

## 5. 接口设计规范
### 5.1 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2026-10-12T00:00:00Z"
}
```

### 5.2 错误格式
```json
{
  "code": 400,
  "message": "Invalid request",
  "error": "VALIDATION_ERROR"
}
```

### 5.3 请求校验
- DTO 校验
- 参数长度和类型限制
- 文件上传类型校验
- 角色权限校验

## 6. 权限控制
### 6.1 角色
- candidate
- employer
- admin

### 6.2 权限规则
- 求职者：只能投递、收藏、查看自己的信息
- 招聘方：可管理自己公司和岗位
- 管理员：可审核岗位/用户/内容

### 6.3 安全机制
- JWT 鉴权
- RBAC 权限校验
- 防止越权访问
- 接口限流

## 7. 数据库设计建议
### 7.1 技术栈
- PostgreSQL
- Redis
- Elasticsearch（可选）

### 7.2 数据库表设计示例
#### users
- id
- email
- password_hash
- role
- name
- avatar
- status

#### companies
- id
- name
- description
- website
- industry
- status

#### jobs
- id
- company_id
- title
- category
- location
- salary_min
- salary_max
- job_type
- remote
- description
- requirements
- status
- published_at

#### applications
- id
- job_id
- user_id
- resume_url
- status

#### favorites
- id
- user_id
- job_id

## 8. 业务规则
- 未认证用户只能查看公开岗位
- 招聘方只能发布自己公司岗位
- 岗位发布后需审核才展示
- 同一个岗位重复投递应做去重处理
- 公司认证状态影响岗位展示优先级

## 9. 后端技术架构建议
### 9.1 推荐架构
- NestJS
- TypeScript
- PostgreSQL
- Redis
- RabbitMQ / Kafka（异步任务）
- S3 对象存储（简历、Logo 等）
- Prometheus + Grafana / OpenTelemetry

### 9.2 分层建议
- Controller
- Service
- Repository
- DTO
- Entity
- Guard / Middleware / Interceptor

### 9.3 模块划分
- auth
- users
- companies
- jobs
- applications
- favorites
- admin
- notifications

## 10. 通知与异步任务
建议异步处理：
- 邮件通知
- 审核通知
- 投递成功提醒
- 企业消息推送

最佳实现：
- 使用消息队列处理异步任务
- 确保关键流程不阻塞主请求

## 11. 非功能需求（后端）
### 11.1 性能
- 列表查询接口 P95 < 500ms
- 关键接口支持缓存
- 读高于写的场景可搭配 Redis

### 11.2 稳定性
- 接口错误统一处理
- 服务日志和链路追踪
- 容错与重试机制

### 11.3 安全性
- 密码加密
- 接口鉴权与鉴权策略
- XSS / SQL 注入 / CSRF 控制
- 日志审计

### 11.4 扩展性
- 支持横向扩展
- 模块化架构可独立升级
- 适合后续增加推荐引擎、统计分析等功能

## 12. 关键指标
- 新增岗位数
- 申请成交/投递率
- 岗位审核通过率
- 接口成功率
- API 响应时间
- 用户活跃度

## 13. 风险与限制
- Web3 岗位真实性难以保证，需要强审核和公司认证
- 高质量候选人流量获取成本较高
- 区块链/加密领域岗位词汇多样，搜索和分类的逻辑要做得规范
- 需要处理反作弊和滥用行为

## 14. 实施计划（后端 MVP）
### Phase 1
- 用户注册登录
- 岗位 CRUD
- 岗位列表与详情
- 投递接口

### Phase 2
- 公司管理
- 收藏与通知
- 审核模块

### Phase 3
- 推荐引擎
- 查询优化
- 后台统计与报表

## 15. 结论
后端的核心任务是搭建一个稳定、可扩展、具备安全和权限控制的招聘平台基础设施。它需要支撑岗位生命周期、用户账户、投递流程、审核机制和通知系统，并为前端提供高质量 API。对于 Web3 赛道来说，后端还必须重视内容真实性和审核内控，以提升平台信任度。
