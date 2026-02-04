// 云函数入口文件 - 获取问题/祈愿列表
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { 
    type,        // 'question' 或 'wish'，可选
    category,    // 分类筛选，可选
    keyword,     // 搜索关键词，可选
    page = 1,    // 页码
    pageSize = 20, // 每页数量
    forTree = false, // 是否用于许愿树显示
    sort = 'new', // 'new' (最新) 或 'hot' (评论数/热度)
    status        // [新增] 支持传入 status 筛选
  } = event

  try {
    // 构造查询条件对象
    let whereOpts = {
      // 默认只显示已审核(1)
      status: status !== undefined ? status : 1
    };

    // 类型筛选
    if (type && ['question', 'wish'].includes(type)) {
      whereOpts.type = type;
    }

    // 分类筛选
    if (category && category !== '全部') {
      whereOpts.category = category;
    }

    // 关键词搜索
    if (keyword && keyword.trim()) {
      whereOpts.content = db.RegExp({
        regexp: keyword.trim(),
        options: 'i'
      });
    }

    // 构建查询
    const query = db.collection('questions').where(whereOpts);

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    // 分页查询
    const skip = (page - 1) * pageSize
    let result

    if (forTree) {
      // 许愿树模式：只获取必要字段，限制数量
      result = await query
        .orderBy('createTime', 'desc')
        .limit(20)
        .field({
          _id: true,
          shortText: true,
          type: true,
          displayX: true,
          displayY: true
        })
        .get()
    } else {
      // 列表模式：获取完整信息
      let listQuery = query;

      if (sort === 'hot') {
        // 根据类型选择排序字段
        // 对于普通提问按回答数(answerCount)，对于祈愿按点赞/同愿数(likeCount)
        const sortField = type === 'wish' ? 'likeCount' : 'answerCount';
        listQuery = listQuery.orderBy(sortField, 'desc');
      }
      
      // 默认/次级排序按时间倒序
      result = await listQuery
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()
    }

    // 格式化数据
    const items = result.data.map(item => {
      return {
        ...item,
        // 用于许愿树的位置
        x: item.displayX || Math.random() * 60 + 20,
        y: item.displayY || Math.random() * 40 + 10,
        // 格式化时间
        timeText: formatTime(item.createTime)
      }
    })

    return {
      success: true,
      data: {
        items: items,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + items.length < total
      }
    }
  } catch (e) {
    console.error('[getQuestions] 错误:', e)
    return {
      success: false,
      errMsg: e.message || '获取列表失败'
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
  
  return `${target.getMonth() + 1}/${target.getDate()}`
}
