// 云函数入口文件 - 点赞/取消点赞回答
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { answerId, action } = event // action: 'like' or 'unlike'
  const wxContext = cloud.getWXContext()

  if (!answerId) {
    return {
      success: false,
      errMsg: '回答ID不能为空'
    }
  }

  try {
    const now = db.serverDate()

    if (action === 'like') {
      // 检查是否已经点赞
      const existingLike = await db.collection('likes')
        .where({
          openid: wxContext.OPENID,
          answerId: answerId
        })
        .get()

      if (existingLike.data && existingLike.data.length > 0) {
        return {
          success: false,
          errMsg: '您已经点过赞了'
        }
      }

      // 创建点赞记录
      await db.collection('likes').add({
        data: {
          openid: wxContext.OPENID,
          answerId: answerId,
          createTime: now
        }
      })

      // 原子性自增点赞数
      await db.collection('answers').doc(answerId).update({
        data: {
          likes: _.inc(1)
        }
      })

      return {
        success: true,
        action: 'like',
        errMsg: '点赞成功'
      }
    } else {
      // 删除点赞记录
      const removeResult = await db.collection('likes')
        .where({
          openid: wxContext.OPENID,
          answerId: answerId
        })
        .remove()

      // 只有确实删除了点赞记录，才减少计数
      if (removeResult.stats.removed > 0) {
        // 原子性自减点赞数
        await db.collection('answers').doc(answerId).update({
          data: {
            likes: _.inc(-1)
          }
        })
      }

      return {
        success: true,
        action: 'unlike',
        errMsg: '取消点赞成功'
      }
    }
  } catch (e) {
    console.error('[likeAnswer] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '操作失败'
    }
  }
}
