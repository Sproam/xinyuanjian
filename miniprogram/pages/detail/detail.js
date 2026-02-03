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

    // 模拟提交
    setTimeout(() => {
      const newAnswer = {
        _id: 'temp_' + Date.now(),
        author: '我 (中大志愿者)',
        major: '待认证专业',
        content: this.data.replyText,
        likes: 0,
        isLiked: false,
        isThanked: false
      };

      this.setData({
        answers: [newAnswer, ...this.data.answers],
        replyText: '',
        isSubmitting: false
      });

      wx.showToast({ title: '回复成功', icon: 'success' });
      wx.vibrateLong();
    }, 800);
  },

  fetchQuestionDetail: function (id) {
    // 模拟根据 ID 获取详情
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
        content: '亲爱的同学，模拟考的意义在于发现问题而不是定义你的能力。我当时也会把错题本看作是“寻宝图”，每解决一个问题就是离中大更近一步。加油！',
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

    // --- 云函数调用逻辑 ---
    /*
    wx.cloud.callFunction({
      name: 'likeAnswer',
      data: {
        answerId: id,
        action: isLiked ? 'unlike' : 'like'
      },
      success: res => {
        console.log('点赞成功', res);
      },
      fail: err => {
        console.error('点赞失败', err);
      }
    });
    */

    // 更新本地 UI 状态 (Mock 逻辑保持，直到接入云端)
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
  },

  onThankAnswer: function (e) {
    const { id } = e.currentTarget.dataset;
    wx.vibrateShort();

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

    wx.showToast({
      title: '已送出感谢！',
      icon: 'success'
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
