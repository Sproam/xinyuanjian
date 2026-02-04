// 云函数入口文件 - 管理员删除评论
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { answerId, questionId } = event // 需要 answerId 来删除，questionId 用来更新计数

  if (!answerId) {
    return {
      success: false,
      errMsg: '评论ID不能为空'
    }
  }

  try {
    // 1. 权限验证：再次查询数据库确保调用者是 admin
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

    // 2. 验证通过，执行删除
    
    // 检查评论是否存在（可选，严谨一点可以检查）
    /*
    const answerCheck = await db.collection('answers').doc(answerId).get()
    if (!answerCheck.data) {
      return { success: false, errMsg: '评论不存在' }
    }
    */

    // 执行删除
    await db.collection('answers').doc(answerId).remove()

    // 3. 更新对应问题的评论计数 (answerCount - 1)
    if (questionId) {
      db.collection('questions').doc(questionId).update({
        data: {
          answerCount: db.command.inc(-1)
        }
      }).catch(err => {
        // 计数更新失败不影响删除结果，打个日志即可
        console.error('更新评论计数失败', err)
      })
    }

    return {
      success: true,
      errMsg: '删除成功'
    }
  } catch (e) {
    console.error('[deleteAnswer] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '删除失败'
    }
  }
}
