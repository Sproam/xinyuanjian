const app = getApp();

Page({
  data: {
    paddingTop: 0, // 顶部避让高度
    currentType: 'question', // 'question' (提问) or 'wish' (祈愿)
    searchQuery: '',
    categories: ['全部', '学习', '生活', '情感', '中大生活'],
    currentCategory: '全部',
    items: [] 
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
    // 模拟全量数据（实际开发中应从云数据库拉取）
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

    // 1. 根据当前 Tab (问题/祈愿) 筛选
    let filteredItems = allItems.filter(item => item.type === this.data.currentType);

    // 2. 根据下方分类筛选
    if (this.data.currentCategory !== '全部') {
      filteredItems = filteredItems.filter(item => item.tag === this.data.currentCategory);
    }
    
    this.setData({ items: filteredItems });
  }
});
