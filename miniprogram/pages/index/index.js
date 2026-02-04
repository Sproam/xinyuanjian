// pages/index/index.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    // 资源路径配置（接入云存储后可修改此处）
    assets: {
      tree: '../../images/tree.jpg',
      tagBg: '../../images/tag_bg.jpg',
      modalBg: '../../images/modal_top_bg.jpg'
    },
    questions: [],
    blessings: [
      "祝愿2026年高考学子金榜题名！",
      "愿每一个中大梦都能在这里起航。",
      "学长学姐在康乐园等你哦~",
      "今天也是元气满满的一天！"
    ],
    ambientElements: [], // 氛围元素（落花）
    categories: ['全部', '学习', '生活', '情感', '中大生活'],
    postCategories: ['学习', '生活', '情感', '中大生活'],
    currentCategory: '全部',
    showModal: false,
    wishText: '',
    selectedCat: '学习',
    isAnonymous: false,
    isSubmitting: false
  },

  onLoad: function() {
    this.setData({ paddingTop: app.globalData.navBarHeight });
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

  // 显示发布弹窗
  showPostModal: function() {
    wx.vibrateShort();
    this.setData({ showModal: true });
  },

  // 隐藏发布弹窗
  hidePostModal: function() {
    this.setData({ showModal: false });
  },

  // 阻止弹窗下的页面滚动
  preventTouch: function() {},

  // 输入监听
  onInputWish: function(e) {
    this.setData({ wishText: e.detail.value });
  },

  // 选择发布分类
  selectPostCat: function(e) {
    wx.vibrateShort();
    this.setData({ selectedCat: e.currentTarget.dataset.cat });
  },

  // 匿名开关
  onAnonymousChange: function(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  // 提交愿望
  submitWish: function() {
    const { wishText, selectedCat, isAnonymous } = this.data;
    if (!wishText.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在挂上枝头...' });

    // 调用云函数发布
    wx.cloud.callFunction({
      name: 'createPost',
      data: {
        content: wishText.trim(),
        category: selectedCat,
        isAnonymous: isAnonymous,
        type: 'wish' // 从首页发布默认为祈愿
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (res.result && res.result.success) {
        // 创建新的愿望标签显示在树上
        const newQuestion = {
          _id: res.result.data._id,
          shortText: wishText.substring(0, 8),
          x: Math.random() * 60 + 20,
          y: Math.random() * 40 + 10,
          delay: 0,
          isNew: true,
          type: 'wish'
        };

        const questions = [newQuestion, ...this.data.questions];
        this.setData({
          questions,
          showModal: false,
          wishText: '',
          isAnonymous: false
        });

        wx.vibrateLong();
        wx.showToast({ title: '挂载成功！', icon: 'success' });
      } else {
        wx.showToast({
          title: res.result?.errMsg || '发布失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      console.error('[createPost] 调用失败:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
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
  },

  onPostClick: function() {
    wx.navigateTo({
      url: '/pages/post/post',
    });
  }
});
