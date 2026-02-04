// pages/admin/audit/audit.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    menuInfo: {},
    items: [],
    loading: false
  },

  onLoad(options) {
    // 获取导航栏高度适配
    const navHeight = app.globalData.navBarHeight || 88;
    const statusHeight = app.globalData.statusBarHeight || 44;
    const menuButtonHeight = app.globalData.menuButtonHeight || 32;
    const menuButtonTop = app.globalData.menuButtonTop || (statusHeight + 4);

    this.setData({
      paddingTop: navHeight,
      menuInfo: {
        height: menuButtonHeight,
        top: menuButtonTop
      }
    });

    this.loadPendingPosts();
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 加载待审核列表
  loadPendingPosts() {
    this.setData({ loading: true });
    
    // 复用 getQuestions 云函数，传入 status: 0
    wx.cloud.callFunction({
      name: 'getQuestions',
      data: {
        status: 0,
        page: 1,
        pageSize: 50 // 一次多拉点
      }
    }).then(res => {
      this.setData({ loading: false });
      console.log('[Audit] 云函数返回:', res.result);
      if (res.result && res.result.success) {
        // 注意：getQuestions 返回的是 res.result.data.items
        const list = res.result.data.items || res.result.data || [];
        console.log('[Audit] 待审核列表:', list);
        this.setData({
          items: list
        });
      } else {
        wx.showToast({ title: res.result?.errMsg || '加载失败', icon: 'none' });
      }
    }).catch(err => {
      console.error(err);
      this.setData({ loading: false });
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  },

  // 审核操作
  handleAudit(e) {
    const dataset = e.currentTarget.dataset;
    const id = dataset.id;
    const action = dataset.action;
    
    // debugging log
    console.log('[Audit] dataset:', dataset);
    console.log('[Audit] Action:', action, 'ID:', id);

    if (!id || !action) {
       console.error('[Audit] 参数缺失! dataset:', dataset);
       wx.showToast({ title: '参数缺失，请重试', icon: 'none' });
       return;
    }

    wx.showLoading({ title: '处理中...' });

    wx.cloud.callFunction({
      name: 'auditPost',
      data: {
        postId: id,
        action: action
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({ title: res.result.errMsg, icon: 'success' }); // Changed to success icon
        // 成功后从列表中移除，加一点延迟让用户看清提示
        setTimeout(() => {
          this.setData({
            items: this.data.items.filter(item => item._id !== id)
          });
        }, 500);
      } else {
        wx.showToast({ title: res.result.errMsg, icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error(err);
      wx.showToast({ title: '调用失败', icon: 'none' });
    });
  }
})
