// src/main.js
var Game = require('./src/game').default || require('./src/game');
// 游戏实例
var game = null;

// 小游戏初始化
wx.onShow(function () {
  console.log('游戏启动');
  if (!game) {
    game = new Game();
  }
});

wx.onHide(function () {
  console.log('游戏暂停');
  if (game) {
    // 可以在这里保存游戏状态
    game = null;
  }
});

wx.togglePause = function () {
  if (game) {
    game.togglePause();
  }
};

// 游戏启动
game = new Game();