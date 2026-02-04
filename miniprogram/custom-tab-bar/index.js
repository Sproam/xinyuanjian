Component({
  data: {
    selected: 0,
    color: "#e0e0e0",
    selectedColor: "#FFD700",
    list: [{
      pagePath: "/pages/index/index",
      text: "树洞"
    }, {
      pagePath: "/pages/square/square",
      text: "广场"
    }, {
      pagePath: "/pages/me/me",
      text: "我的"
    }]
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage) {
        const url = `/${currentPage.route}`;
        const index = this.data.list.findIndex(item => item.pagePath === url);
        // 只有当计算出的 index 与当前不一致时才更新，且只有找到匹配页面才更新
        if (index > -1 && index !== this.data.selected) {
          this.setData({
            selected: index
          });
        }
      }
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
      // 移除这里的 setData，因为页面切换后新页面的 tabbar 实例会重新初始化
      // 依赖 attached 生命周期和页面的 onShow 来设置正确状态
    }
  }
})