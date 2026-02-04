// 云函数入口文件 - 获取用户发布的内容（我的问题/祈愿）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { 
    type,         // 'questions' - 我的问题, 'answers' - 我的回答
    page = 1, 
    pageSize = 20 
  } = event

  try {
    const skip = (page - 1) * pageSize

    if (type === 'answers') {
      // 获取用户的回答
      const countResult = await db.collection('answers')
        .where({ openid: wxContext.OPENID })
        .count()

      const result = await db.collection('answers')
        .where({ openid: wxContext.OPENID })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      // 获取对应的问题信息
      const questionIds = [...new Set(result.data.map(a => a.questionId))]
      let questionsMap = {}

      if (questionIds.length > 0) {
        const questionsResult = await db.collection('questions')
          .where({
            _id: _.in(questionIds)
          })
          .field({
            _id: true,
            shortText: true,
            content: true
          })
          .get()

        questionsResult.data.forEach(q => {
          questionsMap[q._id] = q
        })
      }

      const answers = result.data.map(answer => ({
        ...answer,
        questionInfo: questionsMap[answer.questionId] || {},
        timeText: formatTime(answer.createTime)
      }))

      return {
        success: true,
        data: {
          items: answers,
          total: countResult.total,
          page: page,
          hasMore: skip + answers.length < countResult.total
        }
      }
    } else {
      // 获取用户的问题/祈愿
      const countResult = await db.collection('questions')
        .where({ 
          openid: wxContext.OPENID,
          status: _.neq('deleted')
        })
        .count()

      const result = await db.collection('questions')
        .where({ 
          openid: wxContext.OPENID,
          status: _.neq('deleted')
        })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      const questions = result.data.map(q => ({
        ...q,
        timeText: formatTime(q.createTime)
      }))

      return {
        success: true,
        data: {
          items: questions,
          total: countResult.total,
          page: page,
          hasMore: skip + questions.length < countResult.total
        }
      }
    }
  } catch (e) {
    console.error('[getMyPosts] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '获取失败'
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
