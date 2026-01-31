// pages/me/me.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    userInfo: {
      nickname: '树洞小友',
      role: 'student', // 'student' or 'volunteer'
      avatar: '../../images/tree.jpg'
    },
    stats: {
      wishes: 3,
      answers: 5,
      thanks: 12
    }
  },

  onLoad: function () {
    this.setData({ paddingTop: app.globalData.navBarHeight });
    // 实际开发中从云数据库获取用户信息
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  switchRole: function (e) {
    const { role } = e.currentTarget.dataset;
    if (role === this.data.userInfo.role) return;

    wx.vibrateShort();
    wx.showLoading({ title: '身份切换中...' });

    setTimeout(() => {
      this.setData({
        'userInfo.role': role,
        'userInfo.nickname': role === 'volunteer' ? '中大志愿者-小林' : '树洞小友',
        stats: role === 'volunteer' ? {
          wishes: 0,
          answers: 28,
          thanks: 45
        } : {
          wishes: 3,
          answers: 5,
          thanks: 12
        }
      });
      wx.hideLoading();
      wx.showToast({
        title: `已切换为${role === 'volunteer' ? '志愿者' : '学生'}`,
        icon: 'success'
      });
    }, 500);
  },

  navigateToWishes: function() {
    wx.showToast({ title: '页面开发中', icon: 'none' });
  },

  navigateToAnswers: function() {
    wx.showToast({ title: '页面开发中', icon: 'none' });
  }
});
