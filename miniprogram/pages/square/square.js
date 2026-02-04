const app = getApp();

Page({
  data: {
    paddingTop: 0, // 顶部避让高度
    currentType: 'question', // 'question' (提问) or 'wish' (祈愿)
    searchQuery: '',
    categories: ['全部', '学习', '生活', '情感', '中大生活'],
    currentCategory: '全部',
    currentSort: 'new', // 'new' or 'hot'
    items: [],
    isAdmin: false, // 是否是管理员
    
    // 分页加载相关
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isRefreshing: false,

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
    this.checkAdminRole();
    this.loadData(true);
  },

  checkAdminRole() {
    wx.cloud.callFunction({
      name: 'checkUserRole'
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          isAdmin: res.result.isAdmin
        })
      }
    }).catch(err => {
      console.error('检查权限失败', err)
    })
  },

  onDeletePost(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '管理员操作',
      content: '确定要删除这条内容吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          wx.cloud.callFunction({
            name: 'deletePost',
            data: { questionId: id }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({ title: '删除成功' });
              // Remove the item from list locally
              this.setData({
                items: this.data.items.filter(item => item.id !== id)
              });
            } else {
              wx.showToast({ title: res.result.errMsg, icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: '调用失败', icon: 'none' });
          });
        }
      }
    });
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
      this.loadData(true);
    }
  },

  onCategoryChange(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ currentCategory: cat });
    this.loadData(true);
  },

  onSortChange(e) {
    const sort = e.currentTarget.dataset.sort;
    if (sort !== this.data.currentSort) {
      this.setData({ currentSort: sort });
      this.loadData(true);
    }
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearchConfirm(e) {
    // 兼容键盘搜索键，如果e中有value则使用
    if (e && e.detail && e.detail.value) {
      this.setData({ searchQuery: e.detail.value });
    }
    this.loadData(true);
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`, // Assuming detail page takes an ID
    });
  },

  // 加载数据
  loadData(reset = false) {
    // 如果是加载更多（非重置）且正在加载中，则阻断
    if (!reset && this.data.isLoading) return;
    // 如果是加载更多且没有更多数据，则阻断
    if (!reset && !this.data.hasMore) return;

    const { currentType, currentCategory, searchQuery, page, pageSize } = this.data;
    const curPage = reset ? 1 : page; // 如果是重置，则从第一页开始

    this.setData({ isLoading: true });
    
    // 如果是刷新/搜索，显示加载提示
    if (reset) {
      wx.showLoading({ title: '搜索中...' });
    }

    console.log(`[loadData] 开始加载 reset:${reset}, page:${curPage}, keyword:${searchQuery}`);

    // 调用云函数获取列表
    wx.cloud.callFunction({
      name: 'getQuestions',
      data: {
        type: currentType,
        category: currentCategory,
        keyword: searchQuery,
        page: curPage,
        pageSize: pageSize,
        sort: this.data.currentSort
      }
    }).then(res => {
      console.log('[loadData] 云函数返回成功', res);
      if (reset) {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
        // 增加震动反馈
        wx.vibrateShort({ type: 'light' });
      }
      
      if (res.result && res.result.success) {
        const newItems = res.result.data.items.map(item => ({
          id: item._id,
          // 列表页标题使用更长的内容 (30字)，不再受限于许愿树的8字短标题
          title: item.content.length > 30 ? (item.content.substring(0, 30) + '...') : item.content,
          detail: item.content,
          tag: item.category,
          tagKey: this.getTagKey(item.category),
          time: item.timeText || '刚刚',
          count: item.type === 'wish' 
            ? `${item.likeCount || 0}个同愿` 
            : `${item.answerCount || 0}个回答`,
          type: item.type
        }));
        
        console.log(`[loadData] 解析得到 ${newItems.length} 条数据`);

        this.setData({ 
          items: reset ? newItems : [...this.data.items, ...newItems],
          isLoading: false,
          page: curPage + 1,
          hasMore: res.result.data.hasMore
        });
      } else {
        console.warn('[loadData] 云函数逻辑错误或未部署', res);
        // 云函数调用失败/未部署，使用备用模拟数据
        this.setData({ isLoading: false });
        if (reset) this.loadMockData();
      }
    }).catch(err => {
      console.error('[loadData] 调用失败', err);
      if (reset) {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
      }
      this.setData({ isLoading: false });
      
      // 网络错误时使用模拟数据
      if (reset) this.loadMockData();
    });
  },

  onReachBottom() {
    this.loadData(false);
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    this.loadData(true);
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

    // 关键词过滤
    if (this.data.searchQuery && this.data.searchQuery.trim()) {
      const keyword = this.data.searchQuery.trim();
      filteredItems = filteredItems.filter(item => 
        item.title.includes(keyword) || item.detail.includes(keyword)
      );
    }
    
    this.setData({ items: filteredItems });
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
        this.loadData(true);

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
