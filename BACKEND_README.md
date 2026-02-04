# 中大线上树洞 - 后端设计文档

## 📋 项目概述

这是一个中山大学招生咨询小程序"许愿树/树洞"的后端设计文档。本文档涵盖了云函数设计、数据库设计以及前端调用方式。

---

## 🏗️ 云函数架构

### 云函数列表

| 云函数名称 | 功能描述 | 主要参数 |
|-----------|---------|---------|
| `createPost` | 创建提问或祈愿 | content, category, isAnonymous, type |
| `getQuestions` | 获取问题/祈愿列表 | type, category, keyword, page, pageSize, forTree |
| `getQuestionDetail` | 获取问题详情及回答 | questionId |
| `submitAnswer` | 提交回答 | questionId, content, isAnonymous |
| `likeAnswer` | 点赞/取消点赞回答 | answerId, action ('like'/'unlike') |
| `thankAnswer` | 感谢回答 | answerId |
| `likeWish` | 同愿（给祈愿点赞） | questionId, action ('wish'/'unwish') |
| `getUserInfo` | 获取/更新用户信息 | action, userInfo, role |
| `getMyPosts` | 获取用户发布的内容 | type ('questions'/'answers'), page |
| `deleteQuestion` | 删除问题/祈愿 | questionId |

---

## 📂 云函数详细设计

### 1. createPost - 创建提问/祈愿

**路径:** `cloudfunctions/createPost/index.js`

**功能:** 用户发布新的提问或祈愿

**参数:**
```javascript
{
  content: String,      // 内容（必填）
  category: String,     // 分类：'学习' | '生活' | '情感' | '中大生活'
  isAnonymous: Boolean, // 是否匿名
  type: String          // 类型：'question' | 'wish'
}
```

**返回:**
```javascript
{
  success: Boolean,
  data: { _id: String },
  errMsg: String
}
```

---

### 2. getQuestions - 获取问题列表

**路径:** `cloudfunctions/getQuestions/index.js`

**功能:** 获取问题/祈愿列表，支持分页、分类筛选和关键词搜索

**参数:**
```javascript
{
  type: String,       // 可选：'question' | 'wish'
  category: String,   // 可选：分类筛选
  keyword: String,    // 可选：搜索关键词
  page: Number,       // 页码，默认1
  pageSize: Number,   // 每页数量，默认20
  forTree: Boolean    // 是否用于许愿树显示（只返回必要字段）
}
```

**返回:**
```javascript
{
  success: Boolean,
  data: {
    items: Array,
    total: Number,
    page: Number,
    pageSize: Number,
    hasMore: Boolean
  }
}
```

---

### 3. getQuestionDetail - 获取问题详情

**路径:** `cloudfunctions/getQuestionDetail/index.js`

**功能:** 获取单个问题的详细信息及所有回答

**参数:**
```javascript
{
  questionId: String  // 问题ID（必填）
}
```

**返回:**
```javascript
{
  success: Boolean,
  data: {
    question: Object,  // 问题详情
    answers: Array     // 回答列表（含点赞/感谢状态）
  }
}
```

---

### 4. submitAnswer - 提交回答

**路径:** `cloudfunctions/submitAnswer/index.js`

**功能:** 为问题提交回答

**参数:**
```javascript
{
  questionId: String,   // 问题ID（必填）
  content: String,      // 回答内容（必填）
  isAnonymous: Boolean  // 是否匿名
}
```

**返回:**
```javascript
{
  success: Boolean,
  data: {
    _id: String,
    author: String,
    content: String,
    // ...
  },
  errMsg: String
}
```

---

### 5. likeAnswer - 点赞回答

**路径:** `cloudfunctions/likeAnswer/index.js`

**功能:** 对回答进行点赞或取消点赞

**参数:**
```javascript
{
  answerId: String,  // 回答ID（必填）
  action: String     // 'like' | 'unlike'
}
```

**返回:**
```javascript
{
  success: Boolean,
  action: String,
  errMsg: String
}
```

---

### 6. thankAnswer - 感谢回答

**路径:** `cloudfunctions/thankAnswer/index.js`

**功能:** 向回答者表达感谢（只能感谢一次）

**参数:**
```javascript
{
  answerId: String  // 回答ID（必填）
}
```

---

### 7. likeWish - 同愿

**路径:** `cloudfunctions/likeWish/index.js`

**功能:** 对祈愿表示"同愿"（类似点赞）

**参数:**
```javascript
{
  questionId: String,  // 祈愿ID（必填）
  action: String       // 'wish' | 'unwish'
}
```

---

### 8. getUserInfo - 用户信息管理

**路径:** `cloudfunctions/getUserInfo/index.js`

**功能:** 获取、更新用户信息，切换用户身份

**参数:**
```javascript
{
  action: String,   // 'get' | 'update' | 'switchRole' | 'getStats'
  userInfo: Object, // 更新时的用户信息
  role: String      // 切换身份时：'student' | 'volunteer'
}
```

---

### 9. getMyPosts - 获取我的发布

**路径:** `cloudfunctions/getMyPosts/index.js`

**功能:** 获取当前用户发布的问题或回答

**参数:**
```javascript
{
  type: String,     // 'questions' | 'answers'
  page: Number,
  pageSize: Number
}
```

---

### 10. deleteQuestion - 删除问题

**路径:** `cloudfunctions/deleteQuestion/index.js`

**功能:** 删除用户自己发布的问题（软删除）

**参数:**
```javascript
{
  questionId: String  // 问题ID（必填）
}
```

---

## 🗄️ 数据库设计

### 集合结构

#### 1. questions - 问题/祈愿集合

```javascript
{
  _id: String,            // 自动生成
  content: String,        // 完整内容
  shortText: String,      // 简短文本（用于许愿树标签显示）
  category: String,       // 分类：学习/生活/情感/中大生活
  type: String,           // 类型：question/wish
  isAnonymous: Boolean,   // 是否匿名
  openid: String,         // 发布者openid
  status: String,         // 状态：active/resolved/closed/deleted
  answerCount: Number,    // 回答数量
  likeCount: Number,      // 同愿数量（针对祈愿）
  displayX: Number,       // 许愿树显示X坐标
  displayY: Number,       // 许愿树显示Y坐标
  createTime: Date,       // 创建时间
  updateTime: Date        // 更新时间
}
```

#### 2. answers - 回答集合

```javascript
{
  _id: String,
  questionId: String,     // 关联的问题ID
  content: String,        // 回答内容
  author: String,         // 作者昵称
  major: String,          // 专业
  role: String,           // 角色：student/volunteer
  avatarUrl: String,      // 头像
  isAnonymous: Boolean,   // 是否匿名
  openid: String,         // 回答者openid
  likes: Number,          // 点赞数
  thanksCount: Number,    // 感谢数
  createTime: Date,
  updateTime: Date
}
```

#### 3. users - 用户集合

```javascript
{
  _id: String,
  openid: String,         // 微信openid
  nickname: String,       // 昵称
  avatarUrl: String,      // 头像URL
  role: String,           // 身份：student/volunteer
  major: String,          // 专业
  grade: String,          // 年级
  school: String,         // 学院
  isVerified: Boolean,    // 是否已认证
  createTime: Date,
  updateTime: Date
}
```

#### 4. likes - 点赞记录集合

```javascript
{
  _id: String,
  openid: String,         // 点赞者openid
  answerId: String,       // 被点赞的回答ID
  createTime: Date
}
```

#### 5. thanks - 感谢记录集合

```javascript
{
  _id: String,
  openid: String,         // 感谢者openid
  answerId: String,       // 被感谢的回答ID
  answerOwnerId: String,  // 回答者openid
  createTime: Date
}
```

#### 6. wish_likes - 同愿记录集合

```javascript
{
  _id: String,
  openid: String,         // 同愿者openid
  questionId: String,     // 祈愿ID
  createTime: Date
}
```

---

## 🔧 数据库索引建议

为了提升查询性能，建议创建以下索引：

### questions 集合
- `status` + `createTime`（降序）
- `status` + `type` + `createTime`（降序）
- `openid` + `createTime`（降序）

### answers 集合
- `questionId` + `likes`（降序）
- `openid` + `createTime`（降序）

### likes 集合
- `openid` + `answerId`（唯一索引）

### thanks 集合
- `openid` + `answerId`（唯一索引）

### wish_likes 集合
- `openid` + `questionId`（唯一索引）

---

## 📱 前端调用示例

### 1. 发布问题

```javascript
wx.cloud.callFunction({
  name: 'createPost',
  data: {
    content: '请问中大南校区哪个食堂最好吃？',
    category: '生活',
    type: 'question',
    isAnonymous: false
  },
  success: res => {
    if (res.result.success) {
      wx.showToast({ title: '发布成功', icon: 'success' });
    }
  }
});
```

### 2. 获取许愿树数据

```javascript
wx.cloud.callFunction({
  name: 'getQuestions',
  data: {
    forTree: true
  },
  success: res => {
    if (res.result.success) {
      this.setData({
        questions: res.result.data.items
      });
    }
  }
});
```

### 3. 获取问题详情

```javascript
wx.cloud.callFunction({
  name: 'getQuestionDetail',
  data: {
    questionId: 'xxx'
  },
  success: res => {
    if (res.result.success) {
      this.setData({
        question: res.result.data.question,
        answers: res.result.data.answers
      });
    }
  }
});
```

### 4. 点赞回答

```javascript
wx.cloud.callFunction({
  name: 'likeAnswer',
  data: {
    answerId: 'xxx',
    action: isLiked ? 'unlike' : 'like'
  },
  success: res => {
    if (res.result.success) {
      // 更新UI
    }
  }
});
```

---

## 🚀 部署步骤

### 1. 创建云开发环境

1. 在微信开发者工具中开通云开发
2. 创建云开发环境，获取环境ID
3. 在 `miniprogram/app.js` 中配置环境ID

### 2. 创建数据库集合（详细步骤）

#### 方法一：通过云开发控制台创建

1. **打开云开发控制台**
   - 在微信开发者工具中，点击顶部工具栏的 "云开发" 按钮
   - 或者访问：https://tcb.cloud.tencent.com/

2. **进入数据库管理**
   - 在左侧菜单中点击 "数据库"

3. **创建集合**
   - 点击 "+" 或 "添加集合" 按钮
   - 依次创建以下6个集合：

   | 集合名称 | 用途说明 |
   |---------|---------|
   | `questions` | 存储问题和祈愿 |
   | `answers` | 存储回答 |
   | `users` | 存储用户信息 |
   | `likes` | 存储点赞记录 |
   | `thanks` | 存储感谢记录 |
   | `wish_likes` | 存储同愿记录 |

4. **设置集合权限**
   - 点击每个集合右侧的 "权限设置"
   - 推荐选择 "所有用户可读，仅创建者可写" 或自定义权限

#### 方法二：通过代码自动创建（推荐）

在微信开发者工具的"云开发控制台"中，打开"数据库"，然后点击右上角的"高级操作"，选择"脚本操作"，运行以下代码：

```javascript
// 此脚本用于批量创建数据库集合
const db = wx.cloud.database();

// 需要创建的集合列表
const collections = ['questions', 'answers', 'users', 'likes', 'thanks', 'wish_likes'];

// 注意：实际上在云开发中，集合会在第一次写入数据时自动创建
// 但建议手动创建以便提前配置权限
```

#### 方法三：通过云函数初始化

创建一个初始化云函数 `initDatabase`，部署后调用一次即可：

```javascript
// cloudfunctions/initDatabase/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  // 集合会在首次插入数据时自动创建
  // 这里插入初始化标记数据
  const collections = ['questions', 'answers', 'users', 'likes', 'thanks', 'wish_likes'];
  
  for (const name of collections) {
    try {
      await db.collection(name).add({
        data: { _init: true, createTime: db.serverDate() }
      });
      console.log(`集合 ${name} 创建成功`);
    } catch (e) {
      console.log(`集合 ${name} 可能已存在:`, e.message);
    }
  }
  
  return { success: true, message: '数据库初始化完成' };
};
```

### 3. 配置数据库权限规则

在云开发控制台的数据库页面，点击每个集合，选择"权限设置"，设置以下规则：

**questions 集合：**
```json
{
  "read": true,
  "write": "auth.openid == doc.openid || doc.status == null"
}
```

**answers 集合：**
```json
{
  "read": true,
  "write": "auth.openid == doc.openid || doc._id == null"
}
```

**users 集合：**
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

**likes / thanks / wish_likes 集合：**
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

> **提示**：如果使用云函数操作数据库，权限可以设置更宽松，因为云函数有管理员权限。

### 4. 部署云函数

在微信开发者工具中，右键每个云函数文件夹：
1. 选择"上传并部署：云端安装依赖"
2. 等待部署完成

需要部署的云函数：
- `createPost`
- `getQuestions`
- `getQuestionDetail`
- `submitAnswer`
- `likeAnswer`
- `thankAnswer`
- `likeWish`
- `getUserInfo`
- `getMyPosts`
- `deleteQuestion`

### 4. 配置数据库权限

在云开发控制台，为每个集合设置合适的安全规则：

```json
{
  "read": true,
  "write": "auth.openid == doc.openid"
}
```

或使用自定义安全规则根据业务需求调整。

---

## ⚠️ 注意事项

1. **内容审核**: 云函数中预留了微信内容安全API的调用位置，生产环境建议开启
2. **软删除**: 删除操作采用软删除，将status改为'deleted'，便于数据恢复
3. **原子操作**: 点赞等计数操作使用 `_.inc()` 保证原子性
4. **防重复**: 点赞、感谢等操作会先检查是否已存在记录

---

## 📊 云函数文件结构

```
cloudfunctions/
├── createPost/
│   ├── index.js
│   └── package.json
├── getQuestions/
│   ├── index.js
│   └── package.json
├── getQuestionDetail/
│   ├── index.js
│   └── package.json
├── submitAnswer/
│   ├── index.js
│   └── package.json
├── likeAnswer/
│   ├── index.js
│   └── package.json
├── thankAnswer/
│   ├── index.js
│   └── package.json
├── likeWish/
│   ├── index.js
│   └── package.json
├── getUserInfo/
│   ├── index.js
│   └── package.json
├── getMyPosts/
│   ├── index.js
│   └── package.json
└── deleteQuestion/
    ├── index.js
    └── package.json
```

---

## 📝 更新日志

### v1.1.0 (2026-02-03)
- 完善前端云函数调用
- 更新 `post.js` - 发布提问/祈愿功能对接云函数
- 更新 `square.js` - 列表获取功能对接云函数
- 更新 `index.js` - 许愿树数据获取和发布功能对接云函数
- 更新 `detail.js` - 问题详情、回答、点赞、感谢功能对接云函数
- 更新 `me.js` - 用户信息获取和身份切换功能对接云函数
- 添加备用模拟数据，确保云函数失败时应用仍可正常显示

### v1.0.0 (2026-02-03)
- 初始版本
- 完成10个核心云函数
- 设计6个数据库集合
- 支持提问、祈愿、回答、点赞、感谢等核心功能

---

## 👨‍💻 开发者

如有问题，请联系项目维护者。
