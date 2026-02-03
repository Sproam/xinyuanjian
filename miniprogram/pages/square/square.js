const app = getApp();

Page({
  data: {
    paddingTop: 0, // 顶部避让高度
    currentType: 'question', // 'question' (提问) or 'wish' (祈愿)
    searchQuery: '',
    categories: ['全部', '学习', '生活', '情感', '中大生活'],
    currentCategory: '全部',
    items: [],
    // 弹窗相关数据
    showModal: false,
    wishText: '',
    selectedCat: '学习',
    isAnonymous: false,
    isSubmitting: false 
  },

  onLoad(options) {
    this.setData({
      paddingTop: app.globalData.navBarHeight
    });
    this.refreshList();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // Match the index in custom-tab-bar
      })
    }
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    if (type !== this.data.currentType) {
      this.setData({ 
        currentType: type 
      });
      // Here you would typically reload data based on type
      this.refreshList();
    }
  },

  onCategoryChange(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ currentCategory: cat });
    this.refreshList(); // In real app, filter by category
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearchConfirm() {
    // Perform search
    console.log('Searching for:', this.data.searchQuery);
  },

  goToPost() {
    const type = this.data.currentType;
    wx.navigateTo({
      url: `/pages/post/post?type=${type}`,
    });
  },
  
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`, // Assuming detail page takes an ID
    });
  },

  refreshList() {
    const { currentType, currentCategory, searchQuery } = this.data;
    
    wx.showLoading({ title: '加载中...' });

    // 调用云函数获取列表
    wx.cloud.callFunction({
      name: 'getQuestions',
      data: {
        type: currentType,
        category: currentCategory,
        keyword: searchQuery,
        page: 1,
        pageSize: 20
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        const items = res.result.data.items.map(item => ({
          id: item._id,
          title: item.shortText || item.content.substring(0, 20),
          detail: item.content,
          tag: item.category,
          tagKey: this.getTagKey(item.category),
          time: item.timeText || '刚刚',
          count: item.type === 'wish' 
            ? `${item.likeCount || 0}个同愿` 
            : `${item.answerCount || 0}个回答`,
          type: item.type
        }));
        
        this.setData({ items });
      } else {
        // 云函数调用失败，使用备用模拟数据
        this.loadMockData();
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('[getQuestions] 调用失败:', err);
      // 网络错误时使用模拟数据
      this.loadMockData();
    });
  },

  // 获取标签样式key
  getTagKey(category) {
    const tagMap = {
      '学习': 'study',
      '生活': 'life',
      '情感': 'emotion',
      '中大生活': 'campus'
    };
    return tagMap[category] || 'default';
  },

  // 备用模拟数据
  loadMockData() {
    const allItems = [
      {
        id: 1, 
        title: '中大南校区食堂哪个最好吃？', 
        detail: '听说南校有好几个食堂，新生求推荐！', 
        tag: '生活', 
        tagKey: 'life',
        time: '10分钟前', 
        count: '5个回答',
        type: 'question'
      }, 
      {
        id: 2, 
        title: '计算机专业大一需要准备什么？', 
        detail: '马上要开学了，想利用假期提前学点东西，求学长学姐指路。', 
        tag: '学习', 
        tagKey: 'study',
        time: '1小时前', 
        count: '12个回答',
        type: 'question'
      },
      {
        id: 3, 
        title: '图书馆几点开门？', 
        detail: '想去自习，不知道早上几点可以进去。', 
        tag: '中大生活', 
        tagKey: 'campus',
        time: '3小时前', 
        count: '2个回答',
        type: 'question'
      },
      {
        id: 4, 
        title: '希望能顺利通过四级考试！', 
        detail: '保佑保佑，这次一定要过啊！', 
        tag: '学习', 
        tagKey: 'study',
        time: '5分钟前', 
        count: '10个同愿',
        type: 'wish'
      },
      {
        id: 5, 
        title: '愿家人身体健康', 
        detail: '尤其是奶奶的身体要好起来。', 
        tag: '情感', 
        tagKey: 'emotion',
        time: '半天前', 
        count: '32个同愿',
        type: 'wish'
      }
    ];

    let filteredItems = allItems.filter(item => item.type === this.data.currentType);
    if (this.data.currentCategory !== '全部') {
      filteredItems = filteredItems.filter(item => item.tag === this.data.currentCategory);
    }
    
    this.setData({ items: filteredItems });
  },

  // 搜索确认
  onSearchConfirm() {
    this.refreshList();
  },

  // --- 弹窗相关方法 ---

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

  // 提交愿望/问题
  submitWish: function() {
    const { wishText, selectedCat, isAnonymous, currentType } = this.data;
    if (!wishText.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在发布...' });

    // 调用云函数发布
    wx.cloud.callFunction({
      name: 'createPost',
      data: {
        content: wishText.trim(),
        category: selectedCat,
        isAnonymous: isAnonymous,
        type: currentType // 'question' 或 'wish'
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (res.result && res.result.success) {
        // 重置状态
        this.setData({
          showModal: false,
          wishText: '',
          isAnonymous: false
        });

        // 刷新列表显示新内容
        this.refreshList();

        wx.vibrateLong();
        wx.showToast({ title: '发布成功！', icon: 'success' });
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
  }
});
