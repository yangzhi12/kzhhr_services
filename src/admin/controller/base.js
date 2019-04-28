module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    this.ctx.state.token = this.ctx.header['x-kzhhr-token'] || '';
    console.log(this.ctx.state.token);
    const tokenSerivce = think.service('token', 'admin');
    this.ctx.state.userId = await tokenSerivce.getUserId(this.ctx.state.token);
    // 只允许登录操作
    if (this.ctx.controller !== 'auth') {
      if (this.ctx.state.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
  }
  /**
   * 获取时间戳
   * @returns {Number}
   */
  getTime() {
    return parseInt(new Date().getTime / 1000);
  }
  /**
   * 获取当前登录用户的id
   * @returns {*}
   */
  getLoginUserId() {
    return this.ctx.state.userId;
  }

  /**
   * 获取最大值
   * @returns {*}
   */
  getMaxvalue(...values) {
    console.log(values);
    const levels = values.sort((a, b) => {
      return a - b;
    });
    return levels[levels.length - 1];
  }

  /**
   * 核准团队站点数及扩展数以确定钻级
   * @returns {*}
   */
  reviewTeamOrdersOrExpands(levelOptions, teamorders, expands) {
    let maxlevel = levelOptions[0];
    // 整理数据(将团队签单数和拓展数放在一起，以便判断钻级)
    const level = levelOptions.map(item => {
      return item.expands && expands[item.expands] && expands[item.expands] >= 2
        ? Object.assign(item, { ex: expands[item.expands], tm: teamorders })
        : Object.assign(item, { ex: 0, tm: teamorders });
    });
    // 钻级最终可选列表
    const options = level.filter(item => {
      return item.tm >= item.teamorders || item.ex >= 2;
    });
    // 钻级判定(找出级别最大的)
    options.map(item => {
      parseInt(item.levelno) > parseInt(maxlevel.levelno)
        ? (maxlevel = item)
        : null;
    });
    return maxlevel;
  }
};
