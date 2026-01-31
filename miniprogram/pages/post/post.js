// pages/post/post.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    content: '',
    categories: ['学习', '生活', '情感', '中大生活'],
    category: '学习',
    isAnonymous: false,
    isSubmitting: false,
    type: 'question' // 默认为提问
  },

  onLoad: function(options) {
    this.setData({ 
      paddingTop: app.globalData.navBarHeight,
      statusBarHeight: app.globalData.statusBarHeight
    });
    if (options.type) {
      this.setData({
        type: options.type
      });
      wx.setNavigationBarTitle({
        title: options.type === 'wish' ? '我要祈愿' : '我要提问'
      });
    }
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  onShow: function() {
    // Post页不再是TabBar页面，不需要设置TabBar选中态
  },

  onInput: function(e) {
    this.setData({ content: e.detail.value });
  },

  selectCat: function(e) {
    const { cat } = e.currentTarget.dataset;
    wx.vibrateShort();
    this.setData({ category: cat });
  },

  onAnonymousChange: function(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  submit: function() {
    if (!this.data.content.trim()) return;

    this.setData({ isSubmitting: true });
    wx.vibrateShort();

    // 模拟提交到云开发
    setTimeout(() => {
      this.setData({ isSubmitting: false, content: '' });
      wx.vibrateLong();
      wx.showToast({
        title: '已挂上许愿树',
        icon: 'success',
        duration: 2000
      });

      // 延迟跳转回首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }, 1500);
    }, 1000);
  }
});
