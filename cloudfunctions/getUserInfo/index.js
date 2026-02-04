// 云函数入口文件 - 获取/更新用户信息
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, userInfo } = event
  // action: 'get' - 获取用户信息, 'update' - 更新用户信息, 'switchRole' - 切换身份

  try {
    switch (action) {
      case 'get':
        return await getUserInfo(wxContext.OPENID)
      
      case 'update':
        return await updateUserInfo(wxContext.OPENID, userInfo)
      
      case 'switchRole':
        return await switchRole(wxContext.OPENID, event.role)
      
      case 'getStats':
        return await getUserStats(wxContext.OPENID)
      
      default:
        return await getUserInfo(wxContext.OPENID)
    }
  } catch (e) {
    console.error('[getUserInfo] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '操作失败'
    }
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  const result = await db.collection('users')
    .where({ openid: openid })
    .get()

  if (result.data && result.data.length > 0) {
    const user = result.data[0]
    // 获取用户统计数据
    const stats = await calculateUserStats(openid)
    
    return {
      success: true,
      data: {
        ...user,
        stats: stats,
        isNewUser: false
      }
    }
  } else {
    // 新用户，创建默认记录
    const now = db.serverDate()
    const defaultUser = {
      openid: openid,
      nickname: '树洞小友',
      avatarUrl: '',
      role: 'student', // student 或 volunteer
      major: '',
      grade: '',
      school: '',
      isVerified: false,
      createTime: now,
      updateTime: now
    }

    await db.collection('users').add({ data: defaultUser })

    return {
      success: true,
      data: {
        ...defaultUser,
        stats: { wishes: 0, answers: 0, thanks: 0 },
        isNewUser: true
      }
    }
  }
}

// 更新用户信息
async function updateUserInfo(openid, userInfo) {
  if (!userInfo) {
    return {
      success: false,
      errMsg: '用户信息不能为空'
    }
  }

  // 只允许更新以下字段
  const allowedFields = ['nickname', 'avatarUrl', 'major', 'grade', 'school']
  const updateData = {}
  
  for (const field of allowedFields) {
    if (userInfo[field] !== undefined) {
      updateData[field] = userInfo[field]
    }
  }

  updateData.updateTime = db.serverDate()

  await db.collection('users')
    .where({ openid: openid })
    .update({ data: updateData })

  return {
    success: true,
    errMsg: '更新成功'
  }
}

// 切换用户身份（学生/志愿者）
async function switchRole(openid, role) {
  if (!['student', 'volunteer'].includes(role)) {
    return {
      success: false,
      errMsg: '无效的身份类型'
    }
  }

  await db.collection('users')
    .where({ openid: openid })
    .update({
      data: {
        role: role,
        updateTime: db.serverDate()
      }
    })

  return {
    success: true,
    data: { role: role },
    errMsg: `已切换为${role === 'volunteer' ? '志愿者' : '学生'}身份`
  }
}

// 获取用户统计数据
async function getUserStats(openid) {
  const stats = await calculateUserStats(openid)
  return {
    success: true,
    data: stats
  }
}

// 计算用户统计数据
async function calculateUserStats(openid) {
  // 用户发布的问题/愿望数量
  const wishesCount = await db.collection('questions')
    .where({ openid: openid })
    .count()

  // 用户的回答数量
  const answersCount = await db.collection('answers')
    .where({ openid: openid })
    .count()

  // 用户收到的感谢数量
  const thanksResult = await db.collection('answers')
    .where({ openid: openid })
    .field({ thanksCount: true })
    .get()
  
  const thanksCount = thanksResult.data.reduce((sum, item) => sum + (item.thanksCount || 0), 0)

  return {
    wishes: wishesCount.total,
    answers: answersCount.total,
    thanks: thanksCount
  }
}
