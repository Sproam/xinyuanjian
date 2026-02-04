// 云函数入口文件 - 管理员删帖
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questionId } = event

  if (!questionId) {
    return {
      success: false,
      errMsg: '帖子ID不能为空'
    }
  }

  try {
    // 1. 权限验证：再次查询数据库确保调用者是 admin
    // 不能只相信前端传来的参数，必须查库
    const adminCheck = await db.collection('users')
      .where({
        openid: wxContext.OPENID,
        role: 'admin' // 直接查询 role 为 admin 的记录
      })
      .get()

    if (!adminCheck.data || adminCheck.data.length === 0) {
      return {
        success: false,
        errMsg: '无权操作：非管理员'
      }
    }

    // 2. 验证通过，执行删除
    // 这里使用 hard delete (remove) 还是 soft delete (update status) 取决于需求
    // 通常管理员删除可以使用 remove 彻底清理，或者也用 status='deleted'
    // 这里为了彻底清理违规内容，使用 remove
    
    // 先检查帖子是否存在
    const postCheck = await db.collection('questions').doc(questionId).get()
    if (!postCheck.data) {
      return {
        success: false,
        errMsg: '帖子不存在'
      }
    }

    await db.collection('questions').doc(questionId).remove()
    
    // 如果需要清理相关的回答/评论，也可以在这里补充逻辑
    // await db.collection('answers').where({ questionId: questionId }).remove()

    return {
      success: true,
      errMsg: '删除成功'
    }
  } catch (e) {
    console.error('[deletePost] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '删除失败'
    }
  }
}
