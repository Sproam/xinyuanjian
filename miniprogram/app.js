App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入你在微信开发者工具控制台可见的“环境 ID”
        env: 'prod-shudong-xxxxxx', // TODO: 替换为你的真实环境 ID
        traceUser: true,
      });
    }

    this.globalData = {};
  }
});
