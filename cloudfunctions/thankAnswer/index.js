// 云函数入口文件 - 感谢回答
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { answerId } = event

  if (!answerId) {
    return {
      success: false,
      errMsg: '回答ID不能为空'
    }
  }

  try {
    // 检查是否已经感谢过
    const existingThank = await db.collection('thanks')
      .where({
        openid: wxContext.OPENID,
        answerId: answerId
      })
      .get()

    if (existingThank.data && existingThank.data.length > 0) {
      return {
        success: false,
        errMsg: '您已经感谢过了'
      }
    }

    // 验证回答是否存在
    const answerResult = await db.collection('answers').doc(answerId).get()
    if (!answerResult.data) {
      return {
        success: false,
        errMsg: '回答不存在'
      }
    }

    const now = db.serverDate()

    // 创建感谢记录
    await db.collection('thanks').add({
      data: {
        openid: wxContext.OPENID,
        answerId: answerId,
        answerOwnerId: answerResult.data.openid,
        createTime: now
      }
    })

    // 更新回答的感谢计数
    await db.collection('answers').doc(answerId).update({
      data: {
        thanksCount: _.inc(1)
      }
    })

    return {
      success: true,
      errMsg: '感谢成功'
    }
  } catch (e) {
    console.error('[thankAnswer] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '操作失败'
    }
  }
}
