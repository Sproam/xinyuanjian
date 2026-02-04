// 云函数入口文件 - 检查用户角色
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 查询用户集合
    const result = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .get()

    if (result.data.length > 0) {
      const user = result.data[0]
      return {
        success: true,
        isAdmin: user.role === 'admin'
      }
    } else {
      return {
        success: true,
        isAdmin: false
      }
    }
  } catch (e) {
    console.error('[checkUserRole] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '检查失败',
      isAdmin: false
    }
  }
}
