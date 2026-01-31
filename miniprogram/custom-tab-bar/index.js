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
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
})