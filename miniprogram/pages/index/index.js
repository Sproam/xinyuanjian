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
    if (this.data.currentCategory === '全部') {
      this.fetchQuestions();
    } else {
      this.onCategoryChange({ currentTarget: { dataset: { cat: this.data.currentCategory } } });
    }
    wx.showToast({ title: '已刷新', icon: 'none' });
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
        const questions = res.result.data.items.map((q, index) => ({
          _id: q._id,
          shortText: q.shortText || q.content?.substring(0, 8),
          x: q.displayX || q.x || Math.random() * 60 + 20,
          y: q.displayY || q.y || Math.random() * 40 + 10,
          delay: index * 0.15,
          type: q.type
        }));
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
      { _id: '1', shortText: '数学怎么提分', x: 28, y: 22, delay: 0.2, type: 'question' },
      { _id: '2', shortText: '中大食堂好吃吗', x: 48, y: 15, delay: 0.5, type: 'question' },
      { _id: '3', shortText: '想报岭南学院', x: 68, y: 28, delay: 0.8, type: 'wish' },
      { _id: '4', shortText: '高三好焦虑呀', x: 42, y: 35, delay: 1.1, type: 'question' },
      { _id: '5', shortText: '中大志愿者招募', x: 58, y: 32, delay: 1.4, type: 'wish' },
      { _id: '6', shortText: '如何平衡学习休息', x: 75, y: 20, delay: 0.1, type: 'question' },
      { _id: '7', shortText: '考上中大的学姐', x: 22, y: 32, delay: 0.7, type: 'wish' },
      { _id: '8', shortText: '宿舍环境怎么样', x: 52, y: 45, delay: 0.3, type: 'question' },
    ];
    this.setData({ questions: mockQuestions.slice(0, 20) });
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
          const questions = res.result.data.items.map((q, index) => ({
            _id: q._id,
            shortText: q.shortText || q.content?.substring(0, 8),
            x: q.displayX || q.x || Math.random() * 60 + 20,
            y: q.displayY || q.y || Math.random() * 40 + 10,
            delay: index * 0.15,
            type: q.type,
            category: q.category
          }));
          this.setData({ questions });
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
      { _id: '1', shortText: '数学怎么提分', x: 28, y: 22, delay: 0.2, type: 'question', category: '学习' },
      { _id: '2', shortText: '中大食堂好吃吗', x: 48, y: 15, delay: 0.5, type: 'question', category: '生活' },
      { _id: '3', shortText: '想报岭南学院', x: 68, y: 28, delay: 0.8, type: 'wish', category: '学习' },
      { _id: '4', shortText: '高三好焦虑呀', x: 42, y: 35, delay: 1.1, type: 'question', category: '情感' },
      { _id: '5', shortText: '中大志愿者招募', x: 58, y: 32, delay: 1.4, type: 'wish', category: '中大生活' },
      { _id: '6', shortText: '如何平衡学习休息', x: 75, y: 20, delay: 0.1, type: 'question', category: '学习' },
      { _id: '7', shortText: '考上中大的学姐', x: 22, y: 32, delay: 0.7, type: 'wish', category: '情感' },
      { _id: '8', shortText: '宿舍环境怎么样', x: 52, y: 45, delay: 0.3, type: 'question', category: '中大生活' },
    ];
    const filtered = allMockQuestions.filter(q => q.category === cat);
    this.setData({ questions: filtered });
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
