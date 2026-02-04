// 云函数入口文件 - 管理员审核帖子
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { postId, action } = event 
  // action: 'pass' (通过) or 'reject' (拒绝)

  if (!postId || !['pass', 'reject'].includes(action)) {
    return {
      success: false,
      errMsg: '参数错误'
    }
  }

  try {
    // 1. 权限验证：必须是管理员
    const adminCheck = await db.collection('users')
      .where({
        openid: wxContext.OPENID,
        role: 'admin'
      })
      .get()

    if (!adminCheck.data || adminCheck.data.length === 0) {
      return {
        success: false,
        errMsg: '无权操作：非管理员'
      }
    }

    // 2. 执行更新
    const targetStatus = action === 'pass' ? 1 : -1
    
    await db.collection('questions').doc(postId).update({
      data: {
        status: targetStatus,
        auditTime: db.serverDate(),
        auditBy: wxContext.OPENID
      }
    })

    return {
      success: true,
      errMsg: action === 'pass' ? '审核通过' : '已拒绝'
    }

  } catch (e) {
    console.error('[auditPost] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '操作失败'
    }
  }
}
