// 云函数入口文件 - 获取问题详情及回答列表
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { questionId, sort = 'likes' } = event // sort: 'likes' (默认点赞) 或 'time' (时间)

  if (!questionId) {
    return {
      success: false,
      errMsg: '问题ID不能为空'
    }
  }

  try {
    // 获取问题详情
    const questionResult = await db.collection('questions').doc(questionId).get()
    
    if (!questionResult.data) {
      return {
        success: false,
        errMsg: '问题不存在'
      }
    }

    const question = questionResult.data

    // 构建回答查询
    let answerQuery = db.collection('answers').where({
      questionId: questionId
    });

    // 根据排序参数处理
    if (sort === 'time') {
      // 按发布时间倒序 (最新的在最前)
      answerQuery = answerQuery.orderBy('createTime', 'desc');
    } else {
      // 默认按点赞数 (最热) -> 时间正序
      answerQuery = answerQuery.orderBy('likes', 'desc').orderBy('createTime', 'asc');
    }

    // 获取该问题的所有回答
    const answersResult = await answerQuery.get()

    // 获取当前用户对这些回答的点赞状态
    const answerIds = answersResult.data.map(a => a._id)
    let userLikes = []
    let userThanks = []

    if (answerIds.length > 0) {
      // 查询用户点赞记录
      const likesResult = await db.collection('likes')
        .where({
          openid: wxContext.OPENID,
          answerId: _.in(answerIds)
        })
        .get()
      userLikes = likesResult.data.map(l => l.answerId)

      // 查询用户感谢记录
      const thanksResult = await db.collection('thanks')
        .where({
          openid: wxContext.OPENID,
          answerId: _.in(answerIds)
        })
        .get()
      userThanks = thanksResult.data.map(t => t.answerId)
    }

    // 格式化回答数据
    const answers = answersResult.data.map(answer => ({
      ...answer,
      isLiked: userLikes.includes(answer._id),
      isThanked: userThanks.includes(answer._id),
      timeText: formatTime(answer.createTime)
    }))

    // 判断是否是提问者本人
    const isOwner = question.openid === wxContext.OPENID

    return {
      success: true,
      data: {
        question: {
          ...question,
          isOwner: isOwner,
          timeText: formatTime(question.createTime)
        },
        answers: answers
      }
    }
  } catch (e) {
    console.error('[getQuestionDetail] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '获取详情失败'
    }
  }
}

// 时间格式化辅助函数
function formatTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diff = now - target
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return `${target.getMonth() + 1}月${target.getDate()}日`
}
