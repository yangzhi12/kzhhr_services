module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    this.ctx.state.token = this.ctx.header['x-kzhhr-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    this.ctx.state.userId = await tokenSerivce.getUserId(this.ctx.state.token);

    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');
    // 如果为非公开，则验证用户是否登录
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (
      !publicController.includes(this.ctx.controller) &&
      !publicAction.includes(controllerAction)
    ) {
      if (this.ctx.state.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
  }
  /**
   * 获取时间戳
   * @return {Number}
   */
  getTime() {
    return parseInt(new Date().getTime / 1000);
  }

  /**
   * 获取当前登录用户的id
   * @return {*}
   */
  getLoginUserId() {
    return this.ctx.state.userId;
  }

  /**
   * 获取钻级名称
   * @return {*}
   */
  getLevelName(levelno) {
    const level = {
      '00': '业务员',
      '11': '一钻A',
      '12': '一钻B',
      '13': '一钻C',
      '14': '一钻D',
      '21': '二钻A',
      '22': '二钻B',
      '23': '二钻C',
      '24': '二钻D',
      '31': '三钻A',
      '32': '三钻B',
      '33': '三钻C',
      '34': '三钻D',
      '41': '四钻A',
      '42': '四钻B',
      '43': '四钻C',
      '44': '四钻D',
      '51': '五钻A',
      '52': '五钻B',
      '53': '五钻C',
      '54': '五钻D',
      '55': '五钻E'
    };
    return level[levelno] || '业务员';
  }
};
