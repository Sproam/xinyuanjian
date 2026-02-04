// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    paddingTop: 0,
    questionId: '',
    question: {},
    answers: [],
    currentSort: 'likes', // 'likes' order by default
    replyText: '',
    isSubmitting: false,
    showHearts: false,
    hearts: [],
    isAdmin: false
  },

  onLoad: function (options) {
    const navHeight = app.globalData.navBarHeight || 88; 
    const statusHeight = app.globalData.statusBarHeight || 44;
    const menuButtonHeight = app.globalData.menuButtonHeight || 32;
    const menuButtonTop = app.globalData.menuButtonTop || (statusHeight + 4);

    this.setData({ 
      paddingTop: navHeight,
      statusBarHeight: statusHeight,
      menuInfo: {
        height: menuButtonHeight,
        top: menuButtonTop
      }
    });

    this.checkAdminRole();

    const { id } = options;
    this.setData({ questionId: id });
    this.fetchQuestionDetail(id);
  },

  checkAdminRole() {
    wx.cloud.callFunction({
      name: 'checkUserRole'
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          isAdmin: res.result.isAdmin
        })
      }
    }).catch(err => {
      console.error('检查权限失败', err)
    })
  },

  onDeleteAnswer(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '管理员操作',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          wx.cloud.callFunction({
            name: 'deleteAnswer',
            data: { 
              answerId: id,
              questionId: this.data.questionId 
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({ title: '删除成功' });
              // Remove the item from list locally
              this.setData({
                answers: this.data.answers.filter(item => item._id !== id)
              });
            } else {
              wx.showToast({ title: res.result.errMsg, icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: '调用失败', icon: 'none' });
          });
        }
      }
    });
  },

  changeSort(e) {
    const sort = e.currentTarget.dataset.sort;
    if (sort !== this.data.currentSort) {
      this.setData({ currentSort: sort });
      if (this.data.questionId) {
        this.fetchQuestionDetail(this.data.questionId);
      }
    }
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
        questionId: id,
        sort: this.data.currentSort
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
    const answerIndex = this.data.answers.findIndex(a => a._id === id);
    if (answerIndex === -1) return;

    const answer = this.data.answers[answerIndex];
    const isLiked = answer.isLiked;
    
    // 1. 乐观更新：立即在本地修改 UI，无需等待服务器响应
    const newAnswers = [...this.data.answers];
    newAnswers[answerIndex] = {
      ...answer,
      isLiked: !isLiked,
      likes: isLiked ? answer.likes - 1 : answer.likes + 1
    };
    this.setData({ answers: newAnswers });

    wx.vibrateShort();

    // 2. 后台异步调用云函数
    wx.cloud.callFunction({
      name: 'likeAnswer',
      data: {
        answerId: id,
        action: isLiked ? 'unlike' : 'like'
      }
    }).then(res => {
      // 如果云函数执行成功，通常无需做任何事，因为 UI 已经是正确的
      if (!res.result || !res.result.success) {
        throw new Error(res.result?.errMsg || '点赞失败');
      }
    }).catch(err => {
      console.error('[likeAnswer] 调用失败:', err);
      // 3. 如果失败，需要回滚 UI 状态
      const rollbackAnswers = [...this.data.answers];
      rollbackAnswers[answerIndex] = answer; // 恢复旧状态
      this.setData({ answers: rollbackAnswers });
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  onThankAnswer: function (e) {
    const { id } = e.currentTarget.dataset;
    const answerIndex = this.data.answers.findIndex(a => a._id === id);
    if (answerIndex === -1) return;

    const answer = this.data.answers[answerIndex];
    
    if (answer.isThanked) {
      wx.showToast({ title: '已经感谢过了', icon: 'none' });
      return;
    }

    wx.vibrateShort();

    // 1. 乐观更新：立即触发动效和状态变更
    this.triggerHeartAnimation();
    wx.showToast({ title: '已送出感谢！', icon: 'success' });

    const newAnswers = [...this.data.answers];
    newAnswers[answerIndex] = { ...answer, isThanked: true };
    this.setData({ answers: newAnswers });

    // 2. 后台调用云函数
    wx.cloud.callFunction({
      name: 'thankAnswer',
      data: {
        answerId: id
      }
    }).then(res => {
      if (!res.result || !res.result.success) {
        throw new Error(res.result?.errMsg || '感谢失败');
      }
    }).catch(err => {
      console.error('[thankAnswer] 调用失败:', err);
      // 3. 失败回滚
      const rollbackAnswers = [...this.data.answers];
      rollbackAnswers[answerIndex] = answer;
      this.setData({ answers: rollbackAnswers });
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
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
