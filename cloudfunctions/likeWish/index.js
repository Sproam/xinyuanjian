// 云函数入口文件 - 同愿（给祈愿点赞）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questionId, action } = event // action: 'wish' 或 'unwish'

  if (!questionId) {
    return {
      success: false,
      errMsg: '祈愿ID不能为空'
    }
  }

  try {
    const now = db.serverDate()

    // 验证问题存在且为祈愿类型
    const questionResult = await db.collection('questions').doc(questionId).get()
    if (!questionResult.data) {
      return {
        success: false,
        errMsg: '祈愿不存在'
      }
    }

    if (action === 'wish') {
      // 检查是否已经同愿
      const existingWish = await db.collection('wish_likes')
        .where({
          openid: wxContext.OPENID,
          questionId: questionId
        })
        .get()

      if (existingWish.data && existingWish.data.length > 0) {
        return {
          success: false,
          errMsg: '您已经同愿过了'
        }
      }

      // 创建同愿记录
      await db.collection('wish_likes').add({
        data: {
          openid: wxContext.OPENID,
          questionId: questionId,
          createTime: now
        }
      })

      // 更新祈愿的同愿计数
      await db.collection('questions').doc(questionId).update({
        data: {
          likeCount: _.inc(1)
        }
      })

      return {
        success: true,
        action: 'wish',
        errMsg: '同愿成功'
      }
    } else {
      // 取消同愿
      await db.collection('wish_likes')
        .where({
          openid: wxContext.OPENID,
          questionId: questionId
        })
        .remove()

      await db.collection('questions').doc(questionId).update({
        data: {
          likeCount: _.inc(-1)
        }
      })

      return {
        success: true,
        action: 'unwish',
        errMsg: '取消同愿成功'
      }
    }
  } catch (e) {
    console.error('[likeWish] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '操作失败'
    }
  }
}
