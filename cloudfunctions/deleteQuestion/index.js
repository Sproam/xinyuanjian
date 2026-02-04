// 云函数入口文件 - 删除问题/祈愿
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
      errMsg: '问题ID不能为空'
    }
  }

  try {
    // 验证问题存在且属于当前用户
    const questionResult = await db.collection('questions').doc(questionId).get()
    
    if (!questionResult.data) {
      return {
        success: false,
        errMsg: '问题不存在'
      }
    }

    if (questionResult.data.openid !== wxContext.OPENID) {
      return {
        success: false,
        errMsg: '无权删除他人的问题'
      }
    }

    // 软删除：将状态改为 deleted
    await db.collection('questions').doc(questionId).update({
      data: {
        status: 'deleted',
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      errMsg: '删除成功'
    }
  } catch (e) {
    console.error('[deleteQuestion] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '删除失败'
    }
  }
}
