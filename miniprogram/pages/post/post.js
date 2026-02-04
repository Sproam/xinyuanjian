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
    const navHeight = app.globalData.navBarHeight || 88; 
    const statusHeight = app.globalData.statusBarHeight || 44;
    this.setData({ 
      paddingTop: navHeight,
      statusBarHeight: statusHeight
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
    const { content, category, isAnonymous, type } = this.data;
    
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.vibrateShort();
    wx.showLoading({ title: '正在发布...' });

    // 调用云函数发布
    wx.cloud.callFunction({
      name: 'createPost',
      data: {
        content: content.trim(),
        category: category,
        isAnonymous: isAnonymous,
        type: type
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (res.result && res.result.success) {
        this.setData({ content: '' });
        wx.vibrateLong();
        wx.showToast({
          title: type === 'wish' ? '已挂上许愿树' : '发布成功',
          icon: 'success',
          duration: 2000
        });

        // 延迟跳转回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index',
          });
        }, 1500);
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
