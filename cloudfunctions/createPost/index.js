// 云函数入口文件 - 创建提问或祈愿
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { content, category, isAnonymous, type } = event
  // type: 'question' 或 'wish'

  // 参数校验
  if (!content || !content.trim()) {
    return {
      success: false,
      errMsg: '内容不能为空'
    }
  }

  if (!['question', 'wish'].includes(type)) {
    return {
      success: false,
      errMsg: '类型参数错误'
    }
  }

  const validCategories = ['学习', '生活', '情感', '中大生活']
  if (!validCategories.includes(category)) {
    return {
      success: false,
      errMsg: '分类参数错误'
    }
  }

  try {
    // 内容审核（可选，使用微信内容安全API）
    // const checkResult = await cloud.openapi.security.msgSecCheck({
    //   content: content
    // })
    // if (checkResult.errCode !== 0) {
    //   return { success: false, errMsg: '内容包含敏感信息' }
    // }

    const now = db.serverDate()
    const shortText = content.substring(0, 8) + (content.length > 8 ? '...' : '')

    const result = await db.collection('questions').add({
      data: {
        content: content.trim(),
        shortText: shortText,
        category: category,
        type: type, // 'question' 或 'wish'
        isAnonymous: isAnonymous || false,
        openid: wxContext.OPENID,
        status: 'active', // active, resolved, closed
        answerCount: 0,
        likeCount: 0,
        createTime: now,
        updateTime: now,
        // 用于许愿树显示的随机位置
        displayX: Math.random() * 60 + 20,
        displayY: Math.random() * 40 + 10
      }
    })

    return {
      success: true,
      data: {
        _id: result._id
      },
      errMsg: '发布成功'
    }
  } catch (e) {
    console.error('[createPost] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '发布失败，请重试'
    }
  }
}
