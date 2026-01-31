// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { answerId, action } = event // action: 'like' or 'unlike'
  const wxContext = cloud.getWXContext()

  try {
    if (action === 'like') {
      // 原子性自增点赞数
      return await db.collection('answers').doc(answerId).update({
        data: {
          likes: _.inc(1)
        }
      })
    } else {
      // 原子性自减点赞数
      return await db.collection('answers').doc(answerId).update({
        data: {
          likes: _.inc(-1)
        }
      })
    }
  } catch (e) {
    console.error(e)
    return e
  }
}
