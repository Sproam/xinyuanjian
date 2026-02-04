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
      // 移除这里的 setData，依赖 attached 和 onShow 设置正确状态
    }
  }
})