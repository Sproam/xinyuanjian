// pages/index/index.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    // 资源路径配置（接入云存储后可修改此处）
    assets: {
      tree: '../../images/tree.jpg'
    },
    questions: [],
    ambientElements: [], // 氛围元素（落花）
    categories: ['全部', '学习', '生活', '情感', '中大生活'],
    currentCategory: '全部'
  },

  onLoad: function() {
    // 获取胶囊按钮位置信息，用于对齐刷新按钮
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const statusHeight = app.globalData.statusBarHeight || 44;
    // 计算胶囊按钮距离顶部的距离，或者直接使用 top
    const menuButtonTop = menuButtonInfo.top;
    const menuButtonHeight = menuButtonInfo.height;

    this.setData({ 
      paddingTop: app.globalData.navBarHeight,
      menuInfo: {
        top: menuButtonTop,
        height: menuButtonHeight,
        width: 76,
        right: app.globalData.screenWidth - menuButtonInfo.right // 如果需要对称位置
      }
    });

    this.fetchQuestions();
    this.initAmbient();
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  initAmbient: function() {
    const elements = [];
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: i,
        left: Math.random() * 100,
        duration: Math.random() * 5 + 5,
        delay: Math.random() * 10
      });
    }
    this.setData({ ambientElements: elements });
  },

  // 刷新许愿树标签
  refreshTreeTags: function() {
    wx.vibrateShort();
    // 重新获取数据会触发重新计算位置
    if (this.data.currentCategory === '全部') {
      this.fetchQuestions();
    } else {
      // 模拟重新点击当前分类
      this.onCategoryChange({ currentTarget: { dataset: { cat: this.data.currentCategory } } });
    }
    wx.showToast({
      title: '正在刷新位置...',
      icon: 'none'
    });
  },

  // 防重叠位置生成算法
  generateNonOverlappingPositions: function(items) {
    const placedItems = [];
    const maxAttempts = 50;
    // 假设标签大概占宽 18%，高 25% (根据 CSS样式估算)
    const itemWidth = 18; 
    const itemHeight = 25;
    
    // 可用区域 (在 tree-wrapper 内的百分比)
    // x: 5% ~ 85% (左右留白)
    // y: 5% ~ 65% (上下留白，保留树干底部空间)
    const minX = 5, maxX = 85;
    const minY = 5, maxY = 65;

    return items.map((item, index) => {
      let x, y, overlap;
      let attempts = 0;

      do {
        overlap = false;
        // 随机生成坐标
        x = Math.random() * (maxX - minX) + minX;
        y = Math.random() * (maxY - minY) + minY;
        
        // 检查与已放置项目的碰撞
        for (let placed of placedItems) {
          // 简单的矩形碰撞检测
          // 检查水平距离是否小于宽度总和的一半（略微宽松一点，允许少量视觉重叠增加密度感）
          const xDist = Math.abs(x - placed.x);
          const yDist = Math.abs(y - placed.y);
          
          if (xDist < itemWidth * 0.8 && yDist < itemHeight * 0.8) {
            overlap = true;
            break;
          }
        }
        attempts++;
      } while (overlap && attempts < maxAttempts);

      // 如果尝试多次仍无法找到位置，则强制放置在随机位置（或者后续可以逻辑优化为不显示）
      if (overlap) {
         // console.warn('Could not find non-overlapping position for item', item._id);
      }

      const newItem = {
        ...item,
        x: x,
        y: y,
        // 重新计算延时，让刷新时也有动画
        delay: index * 0.1
      };
      
      placedItems.push(newItem);
      return newItem;
    });
  },

  fetchQuestions: function() {
    // 调用云函数获取许愿树数据
    wx.cloud.callFunction({
      name: 'getQuestions',
      data: {
        forTree: true // 许愿树模式，只获取必要字段
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const rawItems = res.result.data.items.map(q => ({
          _id: q._id,
          shortText: q.shortText || q.content?.substring(0, 8),
          type: q.type
        }));
        
        // 应用防重叠算法
        const questions = this.generateNonOverlappingPositions(rawItems);
        this.setData({ questions });
      } else {
        // 云函数失败，使用备用数据
        this.loadMockQuestions();
      }
    }).catch(err => {
      console.error('[getQuestions] 调用失败:', err);
      // 网络错误时使用模拟数据
      this.loadMockQuestions();
    });
  },

  // 备用模拟数据
  loadMockQuestions: function() {
    const mockQuestions = [
      { _id: '1', shortText: '数学怎么提分', type: 'question' },
      { _id: '2', shortText: '中大食堂好吃吗', type: 'question' },
      { _id: '3', shortText: '想报岭南学院', type: 'wish' },
      { _id: '4', shortText: '高三好焦虑呀', type: 'question' },
      { _id: '5', shortText: '中大志愿者招募', type: 'wish' },
      { _id: '6', shortText: '如何平衡学习休息', type: 'question' },
      { _id: '7', shortText: '考上中大的学姐', type: 'wish' },
      { _id: '8', shortText: '宿舍环境怎么样', type: 'question' },
       { _id: '9', shortText: '高考倒计时加油', type: 'wish' },
      { _id: '10', shortText: '珠海校区风大吗', type: 'question' }
    ];
    
    // 应用防重叠算法
    const questions = this.generateNonOverlappingPositions(mockQuestions);
    this.setData({ questions });
  },

  onCategoryChange: function(e) {
    const cat = e.currentTarget.dataset.cat;
    wx.vibrateShort();
    this.setData({
      currentCategory: cat
    });
    
    // 根据分类筛选
    if (cat === '全部') {
      this.fetchQuestions();
    } else {
      // 先尝试调用云函数按分类筛选
      wx.cloud.callFunction({
        name: 'getQuestions',
        data: {
          forTree: true,
          category: cat
        }
      }).then(res => {
        if (res.result && res.result.success && res.result.data.items.length > 0) {
          const questions = res.result.data.items.map(q => ({
            _id: q._id,
            shortText: q.shortText || q.content?.substring(0, 8),
            type: q.type,
            category: q.category
          }));
          
          // 应用防重叠
          const finalQuestions = this.generateNonOverlappingPositions(questions);
          this.setData({ questions: finalQuestions });
        } else {
          // 云函数返回空结果，使用本地模拟筛选
          this.filterMockQuestions(cat);
        }
      }).catch(err => {
        console.error('[getQuestions] 筛选失败:', err);
        // 云函数失败时使用本地模拟筛选
        this.filterMockQuestions(cat);
      });
    }
  },

  // 本地模拟筛选（备用方案）
  filterMockQuestions: function(cat) {
    const allMockQuestions = [
      { _id: '1', shortText: '数学怎么提分', type: 'question', category: '学习' },
      { _id: '2', shortText: '中大食堂好吃吗', type: 'question', category: '生活' },
      { _id: '3', shortText: '想报岭南学院', type: 'wish', category: '学习' },
      { _id: '4', shortText: '高三好焦虑呀', type: 'question', category: '情感' },
      { _id: '5', shortText: '中大志愿者招募', type: 'wish', category: '中大生活' },
      { _id: '6', shortText: '如何平衡学习休息', type: 'question', category: '学习' },
      { _id: '7', shortText: '考上中大的学姐', type: 'wish', category: '情感' },
      { _id: '8', shortText: '宿舍环境怎么样', type: 'question', category: '中大生活' },
      { _id: '9', shortText: '高考加油', type: 'wish', category: '学习' },
      { _id: '10', shortText: '大学恋爱', type: 'question', category: '情感' }
    ];
    
    const filtered = allMockQuestions.filter(q => q.category === cat);
    // 应用防重叠
    const finalQuestions = this.generateNonOverlappingPositions(filtered);
    this.setData({ questions: finalQuestions });
  },

  onTagTap: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.vibrateShort();
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  }
});
