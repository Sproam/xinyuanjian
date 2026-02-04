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
      // 移除自动设置 selected 的逻辑，完全交由页面 onShow 控制
      // 这样可以避免组件初始化状态与页面设置冲突导致的 Bug
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