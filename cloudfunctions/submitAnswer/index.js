// 云函数入口文件 - 提交回答
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questionId, content, isAnonymous } = event

  // 参数校验
  if (!questionId) {
    return {
      success: false,
      errMsg: '问题ID不能为空'
    }
  }

  if (!content || !content.trim()) {
    return {
      success: false,
      errMsg: '回答内容不能为空'
    }
  }

  try {
    // 验证问题是否存在（跳过模拟数据ID的验证）
    // 模拟数据ID特征：纯数字字符串（如 '1', '2'）或以 'temp_' 开头
    const isMockId = /^[0-9]+$/.test(questionId) || questionId.startsWith('temp_') || questionId.length < 10;
    
    let questionExists = true;
    if (!isMockId) {
      try {
        const questionResult = await db.collection('questions').doc(questionId).get();
        questionExists = !!questionResult.data;
      } catch (queryErr) {
        // 查询失败可能是文档不存在或者集合不存在，继续允许提交
        console.log('查询问题时出错（可能是模拟数据）:', queryErr);
        questionExists = true; // 容错处理
      }
      
      if (!questionExists) {
        return {
          success: false,
          errMsg: '问题不存在'
        };
      }
    }

    // 内容审核（可选）
    // const checkResult = await cloud.openapi.security.msgSecCheck({
    //   content: content
    // })
    // if (checkResult.errCode !== 0) {
    //   return { success: false, errMsg: '内容包含敏感信息' }
    // }

    // 获取用户信息
    let userInfo = {
      nickname: '热心网友',
      major: '待认证'
    }

    // 尝试从用户表获取更多信息
    const userResult = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()

    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0]
      userInfo = {
        nickname: isAnonymous ? '匿名用户' : (user.nickname || '热心网友'),
        major: isAnonymous ? '' : (user.major || '待认证'),
        role: user.role || 'student',
        avatarUrl: isAnonymous ? '' : user.avatarUrl
      }
    }

    const now = db.serverDate()

    // 创建回答
    const result = await db.collection('answers').add({
      data: {
        questionId: questionId,
        content: content.trim(),
        author: userInfo.nickname,
        major: userInfo.major,
        role: userInfo.role,
        avatarUrl: userInfo.avatarUrl,
        isAnonymous: isAnonymous || false,
        openid: wxContext.OPENID,
        likes: 0,
        thanksCount: 0,
        createTime: now,
        updateTime: now
      }
    })

    // 更新问题的回答计数（仅对真实问题ID）
    if (!isMockId) {
      try {
        await db.collection('questions').doc(questionId).update({
          data: {
            answerCount: _.inc(1),
            updateTime: now
          }
        })
      } catch (updateErr) {
        console.log('更新回答计数失败（可能是模拟数据）:', updateErr)
      }
    }

    return {
      success: true,
      data: {
        _id: result._id,
        author: userInfo.nickname,
        major: userInfo.major,
        content: content.trim(),
        likes: 0,
        isLiked: false,
        isThanked: false
      },
      errMsg: '回答成功'
    }
  } catch (e) {
    console.error('[submitAnswer] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '提交失败，请重试'
    }
  }
}
