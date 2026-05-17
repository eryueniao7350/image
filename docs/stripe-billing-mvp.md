# Stripe Billing MVP

这份骨架适配当前仓库的 `Supabase Auth + Supabase Edge Functions + Vercel` 结构。

## 目标

第一版只做：

1. 用户点击升级，跳转 Stripe Checkout
2. 支付成功后通过 webhook 发月度积分
3. 用户可通过 Stripe Customer Portal 管理订阅

## 新增文件

- `/Users/chen/projects/agent-skills-hub/supabase/migrations/010_stripe_billing_mvp.sql`
- `/Users/chen/projects/agent-skills-hub/supabase/functions/create-checkout-session/index.ts`
- `/Users/chen/projects/agent-skills-hub/supabase/functions/create-portal-session/index.ts`
- `/Users/chen/projects/agent-skills-hub/supabase/functions/stripe-webhook/index.ts`
- `/Users/chen/projects/agent-skills-hub/supabase/functions/_shared/stripe.ts`

## 环境变量

Supabase Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `APP_URL`

推荐：

- `APP_URL=https://image-chi-kohl.vercel.app`

前端 Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- 后续如需 Stripe.js 再加 `VITE_STRIPE_PUBLISHABLE_KEY`

## 用户流程

### 升级

前端已登录用户点击升级：

```ts
const { data, error } = await supabase.functions.invoke("create-checkout-session");
window.location.href = data.url;
```

### 管理订阅

```ts
const { data, error } = await supabase.functions.invoke("create-portal-session");
window.location.href = data.url;
```

## Webhook 逻辑

当前骨架已覆盖：

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

推荐把真正“发积分”的动作固定在 `invoice.paid`，避免只靠前端 success page 造成重复赠送。

## 测试顺序

1. Stripe Dashboard 新建 `Pro Monthly` 产品并拿到 `price_id`
2. 执行 `010_stripe_billing_mvp.sql`
3. 部署 3 个新 Edge Functions
4. 配置 Stripe webhook 指向 `stripe-webhook`
5. 登录后调用 `create-checkout-session`
6. 完成测试支付
7. 检查：
   - `profiles.plan`
   - `profiles.subscription_status`
   - `subscriptions`
   - `billing_events`
   - `credit_transactions`

## 下一步建议

做完这套骨架后，下一步最值得补的是：

1. 前端升级按钮接 `create-checkout-session`
2. 历史页或工作台页加“管理订阅”
3. 把“积分不足”提示替换成明确的套餐文案
