// 云函数入口文件 - 创建提问或祈愿
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { content, category, isAnonymous, type } = event
  
  // 必须看这个日志！如果日志里没有这行，说明云端代码没更新
  console.log('[createPost] 开始执行，内容:', content)

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
    // 1. 接入微信内容安全接口 (严谨版)
    try {
      const checkResult = await cloud.openapi.security.msgSecCheck({
        content: content
      })
      
      // 调试日志：去云开发控制台-云函数-日志可以看到这个输出，确认接口是否真的被调用了
      console.log('内容审核结果:', checkResult)
       
      // 严格检查：只要 errCode 存在且不为 0，就拒绝
      if (checkResult.errCode !== 0) {
        return { success: false, errMsg: '内容包含敏感信息，请文明发言' }
      }
    } catch (err) {
      console.error('[内容审核拦截]', err)
      // 87014: 内容违规
      if (err.errCode === 87014) {
        return { success: false, errMsg: '内容包含敏感信息，请文明发言' }
      }
      // 如果出现调用错误（如配置问题），建议在测试阶段先报错，以免上线后被封
      // 如果你希望接口挂了也能发帖（降级处理），可以注释掉下面这行
      // return { success: false, errMsg: '内容审核服务异常，请稍后重试' }
    }

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
        status: 0, // 0 = 待审核, 1 = 审核通过, -1 = 审核拒绝
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
