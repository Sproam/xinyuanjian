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
    this.fetchUserInfo();
  },

  navigateToAudit() {
    wx.navigateTo({
      url: '/pages/admin/audit/audit',
    })
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  // 获取用户信息
  fetchUserInfo: function() {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {
        action: 'get'
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const userData = res.result.data;
        this.setData({
          userInfo: {
            nickname: userData.nickname || '树洞小友',
            role: userData.role || 'student',
            avatar: userData.avatarUrl || '../../images/tree.jpg',
            major: userData.major,
            isVerified: userData.isVerified
          },
          stats: userData.stats || {
            wishes: 0,
            answers: 0,
            thanks: 0
          }
        });
      }
    }).catch(err => {
      console.error('[getUserInfo] 调用失败:', err);
    });
  },

  switchRole: function (e) {
    const { role } = e.currentTarget.dataset;
    if (role === this.data.userInfo.role) return;

    wx.vibrateShort();
    wx.showLoading({ title: '身份切换中...' });

    // 调用云函数切换身份
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {
        action: 'switchRole',
        role: role
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        this.setData({
          'userInfo.role': role
        });
        // 刷新用户统计数据
        this.fetchUserInfo();
        wx.showToast({
          title: res.result.errMsg || `已切换为${role === 'volunteer' ? '志愿者' : '学生'}`,
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.result?.errMsg || '切换失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('[switchRole] 调用失败:', err);
      // 即使失败也更新本地UI
      this.setData({
        'userInfo.role': role,
        'userInfo.nickname': role === 'volunteer' ? '中大志愿者' : '树洞小友'
      });
      wx.showToast({
        title: `已切换为${role === 'volunteer' ? '志愿者' : '学生'}`,
        icon: 'success'
      });
    });
  },

  navigateToWishes: function() {
    wx.navigateTo({
      url: '/pages/square/square?type=wish'
    });
  },

  navigateToAnswers: function() {
    wx.navigateTo({
      url: '/pages/square/square?type=question'
    });
  }
});
