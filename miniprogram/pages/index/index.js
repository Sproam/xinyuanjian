// pages/index/index.js
Page({
  data: {
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

    wx.showLoading({ title: '正在挂上枝头...' });

    // 模拟提交成功后的逻辑
    setTimeout(() => {
      const newQuestion = {
        _id: Date.now().toString(),
        shortText: wishText.substring(0, 8),
        // 优化位置：尽量分布在树冠的中上部
        x: Math.random() * 60 + 20, 
        y: Math.random() * 40 + 10,
        delay: 0,
        isNew: true
      };

      const questions = [newQuestion, ...this.data.questions];
      this.setData({
        questions,
        showModal: false,
        wishText: '',
        isAnonymous: false
      });

      wx.hideLoading();
      wx.vibrateLong(); // 成功后长振动
      wx.showToast({ title: '挂载成功！', icon: 'success' });
    }, 800);
  },

  fetchQuestions: function() {
    // --- 云开发实际调用代码示例 (取消注释即可启用) ---
    /*
    const db = wx.cloud.database();
    db.collection('questions').where({
      status: 'active' // 仅获取活跃的愿望
    }).orderBy('createTime', 'desc').get({
      success: res => {
        this.setData({
          questions: res.data.map(q => ({
            ...q,
            // 随机生成树上的位置
            x: Math.random() * 60 + 20,
            y: Math.random() * 40 + 10
          }))
        });
      }
    });
    */

    // --- 目前使用的 Mock 数据 ---
    // 性能优化：限制树上同时显示的签子数量，避免内存占用过高
    const MAX_VISIBLE_TAGS = 20; 
    
    // 模拟数据生成逻辑
    const mockQuestions = [
      { _id: '1', shortText: '数学怎么提分', x: 28, y: 22, delay: 0.2 },
      { _id: '2', shortText: '中大食堂好吃吗', x: 48, y: 15, delay: 0.5 },
      { _id: '3', shortText: '想报岭南学院', x: 68, y: 28, delay: 0.8 },
      { _id: '4', shortText: '高三好焦虑呀', x: 42, y: 35, delay: 1.1 },
      { _id: '5', shortText: '中大志愿者招募', x: 58, y: 32, delay: 1.4 },
      { _id: '6', shortText: '如何平衡学习休息', x: 75, y: 20, delay: 0.1 },
      { _id: '7', shortText: '考上中大的学姐', x: 22, y: 32, delay: 0.7 },
      { _id: '8', shortText: '宿舍环境怎么样', x: 52, y: 45, delay: 0.3 },
    ];

    this.setData({
      questions: mockQuestions.slice(0, MAX_VISIBLE_TAGS)
    });
  },

  onCategoryChange: function(e) {
    const cat = e.currentTarget.dataset.cat;
    wx.vibrateShort();
    this.setData({
      currentCategory: cat
    });
    
    // 模拟筛选逻辑
    if (cat === '全部') {
      this.fetchQuestions();
    } else {
      const filtered = this.data.questions.filter(q => Math.random() > 0.5); // 模拟筛选效果
      this.setData({ questions: filtered });
    }
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
