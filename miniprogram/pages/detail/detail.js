// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    question: {},
    answers: [],
    replyText: '',
    isSubmitting: false,
    showHearts: false,
    hearts: []
  },

  onLoad: function (options) {
    const navHeight = app.globalData.navBarHeight || 88; 
    const statusHeight = app.globalData.statusBarHeight || 44;
    this.setData({ 
      paddingTop: navHeight,
      statusBarHeight: statusHeight
    });
    const { id } = options;
    this.fetchQuestionDetail(id);
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  onReplyInput: function(e) {
    this.setData({ replyText: e.detail.value });
  },

  submitReply: function() {
    if (!this.data.replyText.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.vibrateShort();
    wx.showLoading({ title: '提交中...' });

    // 调用云函数提交回答
    wx.cloud.callFunction({
      name: 'submitAnswer',
      data: {
        questionId: this.data.question._id,
        content: this.data.replyText.trim(),
        isAnonymous: false
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (res.result && res.result.success) {
        const newAnswer = {
          ...res.result.data,
          isLiked: false,
          isThanked: false
        };

        this.setData({
          answers: [newAnswer, ...this.data.answers],
          replyText: ''
        });

        wx.showToast({ title: '回复成功', icon: 'success' });
        wx.vibrateLong();
      } else {
        wx.showToast({
          title: res.result?.errMsg || '提交失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      console.error('[submitAnswer] 调用失败:', err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    });
  },

  fetchQuestionDetail: function (id) {
    wx.showLoading({ title: '加载中...' });

    // 调用云函数获取详情
    wx.cloud.callFunction({
      name: 'getQuestionDetail',
      data: {
        questionId: id
      }
    }).then(res => {
      wx.hideLoading();

      if (res.result && res.result.success) {
        this.setData({
          question: res.result.data.question,
          answers: res.result.data.answers
        });
      } else {
        // 云函数失败，使用备用模拟数据
        this.loadMockDetail(id);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('[getQuestionDetail] 调用失败:', err);
      // 网络错误时使用模拟数据
      this.loadMockDetail(id);
    });
  },

  // 备用模拟数据
  loadMockDetail: function(id) {
    const mockQuestion = {
      _id: id,
      content: '我是高三的学生，最近模拟考成绩波动很大，感觉很焦虑，想请教一下学长学姐当时是怎么调节心态的？',
      shortText: '高三好焦虑呀',
      category: '心理调适',
      isAnonymous: true
    };

    const mockAnswers = [
      {
        _id: 'a1',
        author: '张学姐',
        major: '中大医学院',
        content: '亲爱的同学，模拟考的意义在于发现问题而不是定义你的能力。我当时也会把错题本看作是"寻宝图"，每解决一个问题就是离中大更近一步。加油！',
        likes: 12,
        isLiked: false,
        isThanked: true
      },
      {
        _id: 'a2',
        author: '李学长',
        major: '岭南学院',
        content: '适当的焦虑是动力，但过度了就需要放松。建议每天抽出15分钟慢跑或者听听音乐，把压力释放出来。',
        likes: 8,
        isLiked: true,
        isThanked: false
      }
    ];

    this.setData({
      question: mockQuestion,
      answers: mockAnswers
    });
  },

  onLikeAnswer: function (e) {
    const { id } = e.currentTarget.dataset;
    const answer = this.data.answers.find(a => a._id === id);
    const isLiked = answer ? answer.isLiked : false;
    
    wx.vibrateShort();

    // 调用云函数点赞
    wx.cloud.callFunction({
      name: 'likeAnswer',
      data: {
        answerId: id,
        action: isLiked ? 'unlike' : 'like'
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 更新本地 UI 状态
        const answers = this.data.answers.map(item => {
          if (item._id === id) {
            return {
              ...item,
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1
            };
          }
          return item;
        });
        this.setData({ answers });
      }
    }).catch(err => {
      console.error('[likeAnswer] 调用失败:', err);
      // 即使云函数失败，也更新本地UI（乐观更新）
      const answers = this.data.answers.map(item => {
        if (item._id === id) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likes: item.isLiked ? item.likes - 1 : item.likes + 1
          };
        }
        return item;
      });
      this.setData({ answers });
    });
  },

  onThankAnswer: function (e) {
    const { id } = e.currentTarget.dataset;
    const answer = this.data.answers.find(a => a._id === id);
    
    if (answer && answer.isThanked) {
      wx.showToast({ title: '已经感谢过了', icon: 'none' });
      return;
    }

    wx.vibrateShort();

    // 调用云函数感谢
    wx.cloud.callFunction({
      name: 'thankAnswer',
      data: {
        answerId: id
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 更新状态
        const answers = this.data.answers.map(item => {
          if (item._id === id) {
            return { ...item, isThanked: true };
          }
          return item;
        });
        this.setData({ answers });

        // 触发动效
        this.triggerHeartAnimation();
        wx.showToast({ title: '已送出感谢！', icon: 'success' });
      } else {
        wx.showToast({ title: res.result?.errMsg || '感谢失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('[thankAnswer] 调用失败:', err);
      // 即使失败也更新UI（乐观更新）
      const answers = this.data.answers.map(item => {
        if (item._id === id) {
          return { ...item, isThanked: true };
        }
        return item;
      });
      this.setData({ answers });
      this.triggerHeartAnimation();
      wx.showToast({ title: '已送出感谢！', icon: 'success' });
    });
  },

  triggerHeartAnimation: function() {
    const hearts = [];
    for (let i = 0; i < 10; i++) {
      hearts.push({
        id: i,
        left: Math.random() * 80 + 10,
        duration: Math.random() * 1 + 1,
        delay: Math.random() * 0.5
      });
    }

    this.setData({ 
      showHearts: true,
      hearts 
    });

    setTimeout(() => {
      this.setData({ showHearts: false, hearts: [] });
    }, 2000);
  }
});
